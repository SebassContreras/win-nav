# Desktop Screen Map & User Journeys

A Screen Map (`screens/<app>.screens.json`) declares what an application exposes on each window:
- **Fields**: Inputs, text edits, search bars, combo boxes.
- **Actions**: Buttons, ribbon tabs, menu items, toggles.
- **Flows**: Single-window parametrized action sequences.
- **Journeys**: Declarative multi-window workflows across dialog transitions.

## Example: Sigestran Screen Map

```json
{
  "$schema": "../schemas/screen-map.schema.json",
  "schemaVersion": "1.0.0",
  "app": {
    "id": "sigestran",
    "name": "Sigestran",
    "processName": "Sigestran.exe",
    "locale": "es-ES",
    "learnedAt": "2026-10-02T15:38:00Z"
  },
  "screens": [
    {
      "id": "menu-principal",
      "titlePattern": "^Menu Principal.*",
      "formName": "MainForm",
      "observedAt": "2026-10-02T15:38:00Z",
      "fields": [
        {
          "id": "buscar-usuario",
          "controlType": "Edit",
          "name": "Search",
          "automationId": "Search",
          "container": "CbSelectUser",
          "sensitive": false,
          "agentFillable": true,
          "locator": { "controlType": "Edit", "automationId": "Search" }
        }
      ],
      "actions": [
        {
          "id": "abrir-ticket",
          "controlType": "Button",
          "name": "BtnAbrirTicket",
          "automationId": "BtnAbrirTicket",
          "kind": "button",
          "effect": "ui-state",
          "locator": { "controlType": "Button", "automationId": "BtnAbrirTicket" }
        },
        {
          "id": "control-tower",
          "controlType": "Button",
          "name": "BtnControlTower",
          "automationId": "BtnControlTower",
          "kind": "button",
          "effect": "ui-state",
          "locator": { "controlType": "Button", "automationId": "BtnControlTower" }
        }
      ],
      "flows": []
    }
  ],
  "journeys": [
    {
      "id": "nuevo-ticket",
      "description": "Abre la ventana de nuevo ticket desde el menú principal",
      "steps": [
        {
          "screenId": "menu-principal",
          "action": "click:@abrir-ticket",
          "expectScreen": "nuevo-ticket-dialog"
        }
      ]
    }
  ]
}
```
