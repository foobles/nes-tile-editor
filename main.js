const NES_COLOR_PALETTE = [
    "#545454",
    "#001e74",
    "#081090",
    "#300088",
    "#440064",
    "#5c0030",
    "#540400",
    "#3c1800",
    "#202a00",
    "#083a00",
    "#004000",
    "#003c00",
    "#00323c",
    "#000000",
    "#989698",
    "#084cc4",
    "#3032ec",
    "#5c1ee4",
    "#8814b0",
    "#a01464",
    "#982220",
    "#783c00",
    "#545a00",
    "#287200",
    "#087c00",
    "#007628",
    "#006678",
    "#000000",
    "#eceeec",
    "#4c9aec",
    "#787cec",
    "#b062ec",
    "#e454ec",
    "#ec58b4",
    "#ec6a64",
    "#d48820",
    "#a0aa00",
    "#74c400",
    "#4cd020",
    "#38cc6c",
    "#38b4cc",
    "#3c3c3c",
    "#eceeec",
    "#a8ccec",
    "#bcbcec",
    "#d4b2ec",
    "#ecaeec",
    "#ecaed4",
    "#ecb4b0",
    "#e4c490",
    "#ccd278",
    "#b4de78",
    "#a8e290",
    "#98e2b4",
    "#a0d6e4",
    "#a0a2a0",
];

const TILE_SCALE = 2;
const TILE_SIZE = 8*TILE_SCALE;

const NAME_TABLE_WIDTH = 256
const NAME_TABLE_HEIGHT = 240

const PATTERN_TABLE_WIDTH = 128
const PATTERN_TABLE_HEIGHT = 128

function ColorButton(colorIndex) {
    let fragment = document.getElementById("color-button-template").content.cloneNode(true);
    let button = fragment.querySelector(".color-button");
    this.colorIndex = colorIndex;
    this.element = button;
}

ColorButton.prototype.setColor = function(color) {
    this.element.querySelector(".color-button__color-rect").style.backgroundColor = color;
};

ColorButton.prototype.addOnClick = function(callback) {
    this.element.addEventListener("click", (e) => callback(e, this));
};


function PaletteOption(palette) {
    let optionTemplate = document.getElementById("palette-option-template");
    let optionFragment = optionTemplate.content.cloneNode(true);
    let option = optionFragment.querySelector(".palette-option");
    let radio = option.querySelector(".palette-option__radio");
    let label = option.querySelector(".palette-option__label");

    radio.id = `palette-radio${palette}`;

    label.setAttribute("for", radio.id);
    label.textContent = `Palette ${palette}`;

    this.buttons = [];
    for (let i = 0; i < 4; ++i) {
        let button = new ColorButton({ palette: palette, color: i });
        this.buttons.push(button);
        option.appendChild(button.element);
    }
    this.palette = palette;
    this.element = option;
}

PaletteOption.prototype.addOnButtonClick = function(callback) {
    for (let button of this.buttons) {
        button.addOnClick(callback);
    }
};

PaletteOption.prototype.addOnSelect = function(callback) {
    this.element.addEventListener("change", (e) => callback(e, this));
};


function PaletteOptionList(userState, colorPicker) {
    let optionList = document.getElementById("palette-option-list");

    this.options = [];
    for (let i = 0; i < 4; ++i) {
        option = new PaletteOption(i);
        this.options.push(option);
        optionList.appendChild(option.element);
    }
    this.element = optionList;
}

PaletteOptionList.prototype.addOnOptionSelect = function(callback) {
    for (let option of this.options) {
        option.addOnSelect(callback);
    }
};

PaletteOptionList.prototype.addOnButtonClick = function(callback) {
    for (let option of this.options) {
        option.addOnButtonClick(callback);
    }
}


function ColorPicker() {
    let colorPicker = document.getElementById("color-picker");
    let grid = colorPicker.querySelector(".color-picker__grid");
    let closeButton = colorPicker.querySelector(".color-picker__close-button");

    closeButton.addEventListener("click", (e) => this.hide());

    let cellsFragment = new DocumentFragment();
    for (let color of NES_COLOR_PALETTE) {
        let cell = document.createElement("div");
        cell.className = "color-picker__grid-cell";
        cell.style.backgroundColor = color;
        cellsFragment.appendChild(cell);
    }
    grid.appendChild(cellsFragment);

    this.element = colorPicker;
}

ColorPicker.prototype.addOnColorClick = function(callback) {
    for (let cell of this.element.querySelectorAll(".color-picker__grid-cell")) {
        cell.addEventListener("click", (e) => callback(e, this, cell.style.backgroundColor));
    }
};

ColorPicker.prototype.showAt = function(x, y) {
    let elem = this.element;
    elem.hidden = false;
    elem.style.left = `${x + 10}px`;
    elem.style.top= `${Math.min(
        y - elem.offsetHeight / 2,
        document.body.clientHeight - elem.offsetHeight
    )}px`;
};

ColorPicker.prototype.hide = function() {
    this.element.hidden = true;
};

function BinaryFileLoad(element) {
    let input = element;
    let reader = new FileReader();
    this.element = element;
    this.reader = reader;

    input.addEventListener("change", (e) => {
        let file = input.files[0];
        console.assert(file);
        reader.abort();
        reader.readAsArrayBuffer(file);
    });
}

BinaryFileLoad.prototype.addOnLoad = function(callback) {
    this.reader.addEventListener("load", (e) => {
        callback(e, this, new Uint8Array(this.reader.result));
    });
}


function Gui() {
    this.colorPicker = new ColorPicker();
    this.colorPicker.hide();
    this.paletteOptionList = new PaletteOptionList();
    this.patternTableFileLoad = new BinaryFileLoad(document.getElementById("pattern-table-file-load"));

    let nameTableCanvas = document.getElementById("name-table-canvas");
    let patternTableCanvas = document.getElementById("pattern-table-canvas");
    nameTableCanvas.width = NAME_TABLE_WIDTH * TILE_SCALE;
    nameTableCanvas.height = NAME_TABLE_HEIGHT * TILE_SCALE;
    patternTableCanvas.width = PATTERN_TABLE_WIDTH * TILE_SCALE;
    patternTableCanvas.height = PATTERN_TABLE_HEIGHT * TILE_SCALE;

    this.nameTableCanvas = nameTableCanvas;
    this.patternTableCanvas = patternTableCanvas;
}

Gui.renderTile = function(ctx, chr, tile, colorArray, x, y) {
    let tileStartIndex = tile * 16;
    for (let row = 0; row < 8; ++row) {
        let rowLow = chr[tileStartIndex+row];
        let rowHigh = chr[tileStartIndex+row+8];
        for (let col = 0; col < 8; ++col) {
            let px = (rowLow & 1) | ((rowHigh & 1) << 1);

            let canvasX = x + (7 - col)*TILE_SCALE;
            let canvasY = y + row*TILE_SCALE;
            ctx.fillStyle = colorArray[px];
            ctx.fillRect(canvasX, canvasY, TILE_SCALE, TILE_SCALE);

            rowLow >>= 1;
            rowHigh >>= 1;
        }
    }
}

Gui.prototype.renderPatternTableCanvas = function(model) {
    let ctx = this.patternTableCanvas.getContext("2d");
    let colorArray = model.colors[model.curPalette];
    for (let y = 0; y < 16; ++y) {
        for (let x = 0; x < 16; ++x) {
            let tile = y*16 + x;
            let pixelX = x*TILE_SIZE;
            let pixelY = y*TILE_SIZE;
            Gui.renderTile(ctx, model.curChr, tile, colorArray, pixelX, pixelY);
        }
    }
};


function GuiModel() {
    this.curTile = 0;
    this.curPalette = 0;
    this.colorPickerTarget = null;
    this.colors = [
        Array(4).fill("#000000"),
        Array(4).fill("#000000"),
        Array(4).fill("#000000"),
        Array(4).fill("#000000"),
    ];

    this.curChr = null;
}

var MODEL

function main() {
    let model = new GuiModel();
    let gui = new Gui();

    gui.paletteOptionList.addOnButtonClick((e, button) => {
        gui.colorPicker.showAt(e.pageX, e.pageY);
        model.colorPickerTarget = button.colorIndex;
    });

    gui.paletteOptionList.addOnOptionSelect((e, option) => {
        model.curPalette = option.palette;
        gui.renderPatternTableCanvas(model);
    });

    gui.colorPicker.addOnColorClick((e, cell, colorValue) => {
        gui.colorPicker.hide();
        let color = model.colorPickerTarget.color;
        let palette = model.colorPickerTarget.palette;

        let updatingBackgroundColor = (color == 0);
        let updatingCurPatternTableCanvas = (updatingBackgroundColor || palette == model.curPalette);

        if (updatingBackgroundColor) {
            for (let i = 0; i < 4; ++i) {
                model.colors[i][0] = colorValue;
                gui.paletteOptionList.options[i].buttons[0].setColor(colorValue);
            }
        } else {
            model.colors[palette][color] = colorValue;
            gui.paletteOptionList.options[palette].buttons[color].setColor(colorValue);
        }

        if (updatingCurPatternTableCanvas) {
            gui.renderPatternTableCanvas(model);
        }
    });

    gui.patternTableFileLoad.addOnLoad((e, input, value) => {
        model.curChr = value;
        gui.renderPatternTableCanvas(model);
    });

    MODEL = model
}

main()