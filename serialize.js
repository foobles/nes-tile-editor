function serializeTiles(tiles) {
    return String.fromCharCode(...tiles);
}

function serializeAttributes(attrs) {
    let ret = "";
    for (let y = 0; y < ATTRIBUTE_TABLE_TILE_HEIGHT; y += 2) {
        for (let x = 0; x < ATTRIBUTE_TABLE_TILE_WIDTH; x += 2) {
            let attr0 = attrs[attributeTableIndex(x, y)];
            let attr1 = attrs[attributeTableIndex(x+1, y)];
            let attr2 = attrs[attributeTableIndex(x, y+1)] || 0;
            let attr3 = attrs[attributeTableIndex(x+1, y+1)] || 0;
            let b = (attr0) | (attr1 << 2) | (attr2 << 4) | (attr3 << 6);
            ret += String.fromCharCode(b);
        }
    }
    return ret;
}

function serializeNameTable(tiles, attributes) {
    return serializeTiles(tiles) + serializeAttributes(attributes);
}
