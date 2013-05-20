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

function mod (num, n) { return ((num % n) + n) % n }

function Region(buffer, x, z) {
  var i, nSectors, offset, sectorNum;

  this.buffer = buffer;
  this.x = x;
  this.z = z;
  this.outOfBounds = __bind(this.outOfBounds, this);
  this.getOffset = __bind(this.getOffset, this);
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
  var data, length, nbtReader, retval, retvalbytes, version;
  if (this.outOfBounds(x, z)) return null
  var offset = this.getOffset(x, z)
  if (offset === 0) {
    return null
  } else {
    this.dataView.seek(offset)
    length = this.dataView.getInt32()
    version = this.dataView.getUint8()
    data = new Uint8Array(this.buffer, this.dataView.tell(), length)
    if (process.browser) retvalbytes = new Zlib.Inflate(data).decompress()
    else retvalbytes = Zlib.inflateSync(data)
    nbtReader = new NBTReader(retvalbytes)
    retval = nbtReader.read()
    return retval
  }
};

Region.prototype.outOfBounds = function(x, z) {
  var rx = +this.x
  var rz = +this.z
  var minx = rx * 32
  var minz = rz * 32
  var maxx = (rx + 1) * 32 - 1
  var maxz = (rz + 1) * 32 - 1
  if (maxx < minx) {
    minx = (rx + 1) * 32 - 1
    maxx = rx * 32
  }
  if (maxz < minz) {
    minz = (rz + 1) * 32 - 1
    maxz = rz * 32
  }
  return x < minx || x > maxx || z < minz || z > maxz
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

module.exports = function(data, x, z) {
  return new Region(data, x, z)
}
