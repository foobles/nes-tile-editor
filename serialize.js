function serializeTiles(tiles) {
    console.assert(tiles.length == 960);
    return tiles;
}

function serializeAttributes(attrs) {
    let ret = [];
    for (let y = 0; y < ATTRIBUTE_TABLE_TILE_HEIGHT; y += 2) {
        for (let x = 0; x < ATTRIBUTE_TABLE_TILE_WIDTH; x += 2) {
            let attr0 = attrs[attributeTableIndex(x, y)];
            let attr1 = attrs[attributeTableIndex(x+1, y)];
            let attr2 = attrs[attributeTableIndex(x, y+1)] || 0;
            let attr3 = attrs[attributeTableIndex(x+1, y+1)] || 0;
            let b = (attr0) | (attr1 << 2) | (attr2 << 4) | (attr3 << 6);
            ret.push(b);
        }
    }
    console.assert(ret.length == 64);
    return ret;
}

function serializeNameTable(tiles, attributes) {
    return serializeTiles(tiles).concat(serializeAttributes(attributes));
}
//  compressed data format:
//      alternating RLE / immediate data packets
//      data starts on RLE
//
//      RLE format:
//          [length (1 to 255)] [byte to repeat]
//      Immediate format:
//          [length (0 to 255)] [bytes to repeat... (matching length)]
//
//      RLE with length 0 signifies end of data
//

function compressRle(out, data) {
    if (data.length == 0) {
        out.push(0);
        return null;
    }

    let first = data[0];
    let run_length = 1;
    while (run_length < Math.min(data.length, 255)) {
        if (data[run_length] != first) {
            break;
        }
        ++run_length;
    }
    out.push(run_length, first);
    return data.slice(run_length);
}

function compressData(out, data) {
    let prev = null;
    let run_length = 0;
    let data_length = 0;
    for (let i = 0; i < Math.min(data.length, 255); ++i) {
        let cur = data[i];
        if (cur == prev) {
            ++run_length;
            if (run_length > 3) {
                run_length = 0;
                break;
            }
        } else {
            data_length += run_length;
            run_length = 1;
            prev = cur;
        }
    }
    data_length += run_length;

    out.push(data_length, ...data.slice(0, data_length));
    return data.slice(data_length);
}

function compress(data) {
    let out = [];
    data = compressRle(out, data);
    while (data) {
        data = compressData(out, data);
        data = compressRle(out, data);
    }
    return out;
}

function toBinString(data) {
    return String.fromCharCode(...data);
}