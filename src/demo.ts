import { spawn } from "node:child_process";
import { UiaBridge } from "./native/uia-bridge.js";
import { ActionExecutor } from "./core/actions.js";
import { RefStore } from "./core/ref-store.js";
import { SecurityGate } from "./core/security-gate.js";
import { SnapshotManager } from "./core/snapshot.js";
import { assertQALoop } from "./ops/qa.js";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log("==================================================");
  console.log("       win-nav: Prueba en Vivo con Bloc de Notas  ");
  console.log("==================================================");

  // 1. Iniciar notepad.exe
  console.log("\n[1/6] Lanzando proceso 'notepad.exe'...");
  const notepadProc = spawn("notepad.exe", { detached: true, stdio: "ignore" });
  notepadProc.unref();

  // Esperar a que la ventana esté lista
  await sleep(1500);

  // 2. Conectar puente nativo FlaUI / UIA3
  console.log("[2/6] Iniciando worker nativo FlaUI (UI Automation UIA3)...");
  const bridge = new UiaBridge();
  await bridge.start();

  try {
    // 3. Descubrir ventana de Notepad
    console.log("[3/6] Buscando proceso y ventana de Notepad...");
    const processes = await bridge.findProcesses("notepad");
    if (processes.length === 0) {
      throw new Error("No se encontró el proceso de Notepad en ejecución.");
    }
    const targetProcess = processes[0];
    console.log(` -> Proceso detectado: ${targetProcess.name} (PID: ${targetProcess.pid})`);

    const windows = await bridge.getWindows(targetProcess.pid);
    console.log(` -> Ventanas detectadas: ${windows.length}`);
    const targetWindow = windows.find((w) => w.title.length > 0) || windows[0];
    console.log(` -> Ventana activa: "${targetWindow?.title || "Sin título"}" (HWND: ${targetWindow?.handle})`);

    // 4. Capturar Snapshot UIA3
    console.log("\n[4/6] Capturando snapshot del árbol de controles UIA3...");
    const snapshot = await bridge.getTree({
      handle: targetWindow?.handle,
      pid: targetProcess.pid,
    });
    console.log(` -> Título de ventana: "${snapshot.windowTitle}"`);
    console.log(` -> Controles interactivos encontrados: ${snapshot.elements.length}`);

    // Mostrar los primeros controles encontrados
    for (const el of snapshot.elements.slice(0, 10)) {
      console.log(`    * [${el.ref}] ${el.role}: "${el.name || el.automationId || "(sin nombre)"}" (enabled: ${el.isEnabled})`);
    }

    // Guardar snapshot a .agent/snapshot.json
    const snapshotManager = new SnapshotManager();
    await snapshotManager.saveSnapshot(snapshot);
    console.log(" -> Snapshot guardado en .agent/snapshot.json");

    // Configurar RefStore y SecurityGate
    const refStore = new RefStore();
    refStore.setSnapshot(snapshot);
    const securityGate = new SecurityGate();
    const executor = new ActionExecutor(securityGate, refStore, bridge);

    // Buscar el control de edición de texto (Document o Edit)
    const textEdit =
      snapshot.elements.find((e) => e.role === "Document" || e.role === "Edit") ||
      snapshot.elements[0];

    if (!textEdit) {
      throw new Error("No se encontró un control editable en la ventana.");
    }

    console.log(`\n[5/6] Control objetivo seleccionado: [${textEdit.ref}] ${textEdit.role} "${textEdit.name || textEdit.automationId}"`);

    // Prueba en modo DRY-RUN primero
    console.log(" -> Ejecutando acción en modo DRY-RUN...");
    const dryRunResult = await executor.execute({
      action: "fill",
      target: textEdit.ref,
      value: "Hola desde win-nav! Automatizado con UI Automation nativo.",
      isArmed: false,
    });
    console.log(`    ${dryRunResult.preview}`);

    // Re-registrar snapshot para la ejecución armada
    refStore.setSnapshot(snapshot);

    // Ejecución ARMADA en vivo
    console.log(" -> Ejecutando acción ARMADA en vivo en la aplicación...");
    const armedResult = await executor.execute({
      action: "fill",
      target: textEdit.ref,
      value: "¡Hola! win-nav ha escrito este texto automáticamente usando UIA3 nativo y FlaUI.",
      isArmed: true,
      allowedProcesses: ["notepad.exe", "notepad"],
    });
    console.log(`    ${armedResult.preview}`);

    // 5. Esperar a que se asiente la UI y capturar nuevo snapshot para verificar
    await sleep(800);
    console.log("\n[6/6] Ejecutando bucle de aseguramiento de calidad (QA Loop)...");
    const verifiedSnapshot = await bridge.getTree({
      handle: targetWindow?.handle,
      pid: targetProcess.pid,
    });

    // Validar con assertQALoop
    const qaReport = assertQALoop(verifiedSnapshot, [
      {
        kind: "assert:visible",
        target: textEdit.automationId || textEdit.name || textEdit.ref,
        message: "El editor de texto debe estar visible.",
      },
      {
        kind: "assert:text",
        target: textEdit.automationId || textEdit.name || textEdit.ref,
        expected: "win-nav",
        message: "El texto en pantalla debe contener 'win-nav'.",
      },
    ]);

    console.log(` -> QA Report: ${qaReport.passedCount}/${qaReport.total} aserciones pasadas exitosamente.`);
    console.log("\n==================================================");
    console.log("   ¡PRUEBA EXITOSA! El texto se escribió solo.    ");
    console.log("   (Puedes ver la ventana del Bloc de Notas abierta)");
    console.log("==================================================");
  } finally {
    await bridge.stop();
  }
}

runDemo().catch((err) => {
  console.error("\n❌ Error durante la prueba:", err);
  process.exit(1);
});
