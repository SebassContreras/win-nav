export interface ProcessInfo {
  pid: number;
  name: string;
  mainWindowTitle: string;
  mainWindowHandle: number;
}

export interface WindowInfo {
  handle: number;
  title: string;
  automationId: string;
  className: string;
  pid: number;
}

export interface JsonRpcRequest<T = unknown> {
  jsonrpc?: "2.0";
  id: number;
  method: string;
  params?: T;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
