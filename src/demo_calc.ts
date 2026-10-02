import { UiaBridge } from "./native/uia-bridge.js";
import { ActionExecutor } from "./core/actions.js";
import { RefStore } from "./core/ref-store.js";
import { SecurityGate } from "./core/security-gate.js";
import { SnapshotManager } from "./core/snapshot.js";
import { assertQALoop } from "./ops/qa.js";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCalcDemo() {
  console.log("==================================================");
  console.log("   win-nav: Demostración Autónoma en Calculadora  ");
  console.log("==================================================");

  const bridge = new UiaBridge();
  await bridge.start();

  try {
    // 1. Localizar la ventana de la Calculadora
    console.log("\n[1/5] Localizando la ventana de la Calculadora de Windows...");
    const windows = await bridge.getWindows();
    const calcWin = windows.find((w) => w.title.toLowerCase().includes("calc"));

    if (!calcWin) {
      throw new Error("No se encontró la ventana de la Calculadora.");
    }
    console.log(` -> Ventana encontrada: "${calcWin.title}" (HWND: ${calcWin.handle})`);

    // 2. Capturar árbol de controles UIA3
    console.log("\n[2/5] Capturando snapshot UIA3 de los controles interactivos...");
    let snapshot = await bridge.getTree({ handle: calcWin.handle });
    console.log(` -> Total de controles detectados: ${snapshot.elements.length}`);

    // Guardar snapshot a .agent/snapshot.json
    const snapshotManager = new SnapshotManager();
    await snapshotManager.saveSnapshot(snapshot);
    console.log(" -> Snapshot guardado en .agent/snapshot.json");

    const refStore = new RefStore();
    const securityGate = new SecurityGate();
    const executor = new ActionExecutor(securityGate, refStore, bridge);

    // Helper para pulsar un botón por AutomationId
    async function clickButton(autoId: string, label: string) {
      refStore.setSnapshot(snapshot);
      const el = snapshot.elements.find((e) => e.automationId === autoId);
      if (!el) {
        throw new Error(`Botón no encontrado: ${autoId}`);
      }

      console.log(` -> Pulsando [${el.ref}] "${label}" (${el.automationId})...`);
      const result = await executor.execute({
        action: "click",
        target: el.ref,
        isArmed: true,
        allowedProcesses: ["*"],
      });
      console.log(`    ${result.preview}`);
      await sleep(400);

      // Refrescar snapshot tras mutación armada
      snapshot = await bridge.getTree({ handle: calcWin!.handle });
    }

    // 3. Borrar estado anterior pulsando 'clearButton'
    console.log("\n[3/5] Limpiando estado previo...");
    await clickButton("clearButton", "Borrar (C)");

    // 4. Ejecutar operación matemática automática: 7 + 5 = 12
    console.log("\n[4/5] Ejecutando cálculo matemático autónomo: 7 + 5 = ...");
    await clickButton("num7Button", "7");
    await clickButton("plusButton", "+");
    await clickButton("num5Button", "5");
    await clickButton("equalButton", "=");

    // 5. Verificación QA
    console.log("\n[5/5] Ejecutando QA Loop sobre la ventana...");
    const qaReport = assertQALoop(snapshot, [
      {
        kind: "assert:window-title",
        expected: "Calculadora",
        message: "El título de la ventana debe ser Calculadora.",
      },
      {
        kind: "assert:visible",
        target: "equalButton",
        message: "El botón igual debe estar visible.",
      },
      {
        kind: "assert:enabled",
        target: "equalButton",
        message: "El botón igual debe estar habilitado.",
      },
    ]);

    console.log(` -> QA Report: ${qaReport.passedCount}/${qaReport.total} aserciones pasadas exitosamente.`);
    console.log("\n==================================================");
    console.log("   ¡OPERACIÓN COMPLETADA EXITOSAMENTE!           ");
    console.log("   (Mira la Calculadora en tu pantalla: 7 + 5 = 12)");
    console.log("==================================================");
  } finally {
    await bridge.stop();
  }
}

runCalcDemo().catch((err) => {
  console.error("Error en demo:", err);
  process.exit(1);
});
