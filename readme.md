# minecraft-region

parses chunks out of a minecraft region file

extracted from code originally written by @ithkuil for [mcchunkloader](https://github.com/ithkuil/mcchunkloader), turned into a module and now maintained by @maxogden

minecraft is property of Mojang AB

```javascript
var mcRegion = require('minecraft-region')
var region = mcRegion(binaryRegionData) // from a .mca file
var chunkX = 0
var chunkY = 0
if (region.hasChunk(chunkX, chunkY))
  var chunk = region.getChunk(chunkX, chunkY)

now use the chunk with minecraft-region to get voxel data
```

this module works with [minecraft-chunk](http://github.com/maxogden/minecraft-chunk) and is used by [minecraft-mca](http://github.com/maxogden/minecraft-mca)


designed for use with [browserify](http://browserify.org)

# license

BSD