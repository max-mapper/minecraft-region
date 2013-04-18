var dataview = require('jDataView');
var NBTReader = require('minecraft-nbt').NBTReader;
var chunk = require('minecraft-chunk');
if (process.browser) var Zlib = require('./zlib-inflate.min').Zlib
else var Zlib = require('./zlibjs-node')

var CHUNK_HEADER_SIZE, SECTOR_BYTES, SECTOR_INTS, emptySector, emptySectorBuffer, sizeDelta,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

SECTOR_BYTES = 4096;

SECTOR_INTS = SECTOR_BYTES / 4;

CHUNK_HEADER_SIZE = 5;

emptySectorBuffer = new ArrayBuffer(4096);

emptySector = new Uint8Array(emptySectorBuffer);

sizeDelta = 0;

function mod (num, n) { return ( num < 0 ? (num % n) + n : num % n) }

function Region(buffer, x, z) {
  var i, nSectors, offset, sectorNum;

  this.buffer = buffer;
  this.x = x;
  this.z = z;
  this.hasChunk = __bind(this.hasChunk, this);
  this.getOffset = __bind(this.getOffset, this);
  this.outOfBounds = __bind(this.outOfBounds, this);
  this.getChunk = __bind(this.getChunk, this);
  this.dataView = new dataview(this.buffer);
  sizeDelta = 0;
  var length = this.buffer.byteLength || this.buffer.length
  nSectors = length / SECTOR_BYTES;
  this.sectorFree = [];
  for (i = 0; i <= nSectors - 1; ++i)
    this.sectorFree.push(true)
  this.sectorFree[0] = false;
  this.sectorFree[1] = false;
  this.dataView.seek(0);
  this.offsets = new Int32Array(this.buffer, 0, SECTOR_INTS);
  
  for (var i = 0; i <= SECTOR_INTS; ++i) {
    offset = this.dataView.getInt32();
    if (offset !== 0 && (offset >> 16) + ((offset >> 8) & 0xFF) <= this.sectorFree.length) {
      for (sectorNum = 0; sectorNum <= ((offset >> 8) & 0xFF) - 1; ++sectorNum) {
        var el = (offset >> 16) + sectorNum
        this.sectorFree[el] = false;
      }
    }
  }
}

Region.prototype.getChunk = function(x, z) {
  var data, length, nbtReader, offset, retval, retvalbytes, version;

  offset = this.getOffset(x, z);
  if (offset === 0) {
    console.log("Not able to show chunk at (" + x + ", " + z + ")");
    return null;
  } else {
    this.dataView.seek(offset);
    length = this.dataView.getInt32();
    version = this.dataView.getUint8();
    data = new Uint8Array(this.buffer, this.dataView.tell(), length);
    if (process.browser) retvalbytes = new Zlib.Inflate(data).decompress();
    else retvalbytes = Zlib.inflateSync(data)
    nbtReader = new NBTReader(retvalbytes);
    retval = nbtReader.read();
    return retval;
  }
};

Region.prototype.outOfBounds = function(x, z) {
  return x < 0 || x >= 32 || z < 0 || z >= 32;
};

Region.prototype.getOffset = function(x, z) {
  var bytes, locationOffset, offset, sectors;
  x = Math.abs(mod(x, 32))
  z = Math.abs(mod(z, 32))  
  locationOffset = 4 * (x + z * 32)
  bytes = new Uint8Array(this.buffer, locationOffset, 4);
  sectors = bytes[3];
  offset = bytes[0] << 16 | bytes[1] << 8 | bytes[2];
  if (offset === 0) {
    return 0;
  } else {
    return offset * 4096;
  }
};

Region.prototype.hasChunk = function(x, z) {
  var offset;

  offset = this.getOffset(x, z);
  return offset !== 0;
};

module.exports = function(data, x, z) {
  return new Region(data, x, z)
}
