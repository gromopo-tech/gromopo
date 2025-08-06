declare module 'bigint-buffer' {
  export function toBigIntLE(buf: Buffer, offset?: number): bigint;
  export function toBigIntBE(buf: Buffer, offset?: number): bigint;
  export function toBufferLE(value: bigint | number, size: number): Buffer;
  export function toBufferBE(value: bigint | number, size: number): Buffer;
}
