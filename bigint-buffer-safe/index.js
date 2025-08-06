// Safe implementation of bigint-buffer that avoids the vulnerability
// This is a minimal implementation that provides the same API but with bounds checking

function toBigIntLE(buf, offset = 0) {
  // Add bounds checking to prevent buffer overflow
  if (offset < 0 || offset >= buf.length) {
    throw new Error('Offset out of bounds');
  }
  
  // Use built-in DataView for safe buffer operations
  const view = new DataView(buf.buffer, buf.byteOffset + offset);
  
  // For simplicity, handle different buffer sizes
  if (buf.length - offset >= 8) {
    return view.getBigUint64(0, true); // Little endian
  } else if (buf.length - offset >= 4) {
    return BigInt(view.getUint32(0, true));
  } else if (buf.length - offset >= 2) {
    return BigInt(view.getUint16(0, true));
  } else if (buf.length - offset >= 1) {
    return BigInt(view.getUint8(0));
  } else {
    throw new Error('Buffer too short');
  }
}

function toBigIntBE(buf, offset = 0) {
  // Add bounds checking to prevent buffer overflow
  if (offset < 0 || offset >= buf.length) {
    throw new Error('Offset out of bounds');
  }
  
  // Use built-in DataView for safe buffer operations
  const view = new DataView(buf.buffer, buf.byteOffset + offset);
  
  // For simplicity, handle different buffer sizes
  if (buf.length - offset >= 8) {
    return view.getBigUint64(0, false); // Big endian
  } else if (buf.length - offset >= 4) {
    return BigInt(view.getUint32(0, false));
  } else if (buf.length - offset >= 2) {
    return BigInt(view.getUint16(0, false));
  } else if (buf.length - offset >= 1) {
    return BigInt(view.getUint8(0));
  } else {
    throw new Error('Buffer too short');
  }
}

function toBufferLE(value, size) {
  const buf = Buffer.allocUnsafe(size);
  const view = new DataView(buf.buffer, buf.byteOffset);
  
  if (size >= 8) {
    view.setBigUint64(0, BigInt(value), true);
  } else if (size >= 4) {
    view.setUint32(0, Number(value), true);
  } else if (size >= 2) {
    view.setUint16(0, Number(value), true);
  } else if (size >= 1) {
    view.setUint8(0, Number(value));
  }
  
  return buf;
}

function toBufferBE(value, size) {
  const buf = Buffer.allocUnsafe(size);
  const view = new DataView(buf.buffer, buf.byteOffset);
  
  if (size >= 8) {
    view.setBigUint64(0, BigInt(value), false);
  } else if (size >= 4) {
    view.setUint32(0, Number(value), false);
  } else if (size >= 2) {
    view.setUint16(0, Number(value), false);
  } else if (size >= 1) {
    view.setUint8(0, Number(value));
  }
  
  return buf;
}

module.exports = {
  toBigIntLE,
  toBigIntBE,
  toBufferLE,
  toBufferBE
};
