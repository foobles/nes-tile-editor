function decompressRle(out, data) {
    let run_length = data[0];
    if (run_length == 0) {
        return null;
    }
    let elem = data[1];
    out.push(...Array(run_length).fill(elem));
    return data.slice(2);
}

function decompressData(out, data) {
    let data_length = data[0];
    out.push(...data.slice(1, 1+data_length));
    return data.slice(1+data_length);
}


function decompress(data) {
    let out = [];
    data = decompressRle(out, data);
    while (data) {
        data = decompressData(out, data);
        data = decompressRle(out, data);
    }
    return out;
}

function deserializeNameTable(model, data) {
    console.assert(data.length == 1024)
    let tileData = data.slice(0, 960);
    let attributeData = data.slice(960);

    deserializeTiles(model, tileData);
    deserializeAttributes(model, attributeData);
}

function deserializeTiles(model, tileData) {
    console.assert(tileData.length == 960);
    model.tiles = tileData;
}

function deserializeAttributes(model, attributeData) {
    console.assert(attributeData.length == 64);
    for (let y = 0; y < ATTRIBUTE_TABLE_TILE_HEIGHT; y += 2) {
        for (let x = 0; x < ATTRIBUTE_TABLE_TILE_WIDTH; x += 2) {
            let packedAttributes = attributeData[y/2 * ATTRIBUTE_TABLE_TILE_WIDTH/2 + x/2];
            model.attributes[attributeTableIndex(x, y)] = packedAttributes & 0b11;
            model.attributes[attributeTableIndex(x+1, y)] = (packedAttributes >> 2) & 0b11;
            if (y+1 < ATTRIBUTE_TABLE_TILE_HEIGHT) {
                model.attributes[attributeTableIndex(x, y+1)] = (packedAttributes >> 4) & 0b11;
                model.attributes[attributeTableIndex(x+1, y+1)] = (packedAttributes >> 6) & 0b11;
            }
        }
    }
}