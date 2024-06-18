/** Элемент управления размытием миниатюр изображений. */
class BlurringControl
{
    /** Контейнер, в котором располагаются миниатюры изображений. */
    static containerElement;

    /**
     * Функция, вызываемая после изменения свойства overlayOn.
     * @type Function
     */
    static overlayChangeCallback = null;

    /** Используемые идентификаторы DOM-элементов. */
    static elementIDs = Object.seal({
        main: "blurOverlay",
        range: "blurRangeOverlay"
    });

    static #overlayOn = false;
    static #overlayElement = null;
    static #rangeElement = null;
    static #bindedRangeElement = null;
    static #tempVisibleThumb;
    static #preventDefaultActions;


    /**
     * Задает или возращает значение, указывающее, включено ли окошко управления размытием.
     * @param {boolean} value
     */
    static set overlayOn(value)
    {
        this.#overlayOn = value;
        if (!this.#overlayElement)
            this.#createOverlay();
        this.#overlayElement.hidden = !this.#overlayOn;
        if (this.overlayChangeCallback)
            this.overlayChangeCallback();
    }

    static get overlayOn()
    {
        return this.#overlayOn;
    }

    /**
     * Возвращает DOM-элемент окошка управления размытием.
     * @returns {HTMLDivElement?}
     */
    static get overlayElement()
    {
        return this.#overlayElement;
    }

    /**
     * Возвращает DOM-элемент ползунка управления размытием.
     * @returns {HTMLInputElement?}
     */
    static get rangeElement()
    {
        return this.#rangeElement;
    }


    /**
     * Активирует управление размытием на текущей странице.
     * @param {boolean} allowTempShow При значении true позволяет временно убирать размытие с миниатюры
     * при нажатии ЛКМ с зажатой клавишей Ctrl.
     */
    static enable(allowTempShow = true)
    {
        this.containerElement ??= document.body;
        document.addEventListener("keydown", this.#handleKeyDown);
        if (!allowTempShow) return;
        this.containerElement.addEventListener("mousedown", this.#handleMouseDown);
        document.addEventListener('mouseup', this.#handleMouseUp);
        this.containerElement.addEventListener('click', this.#thumbPreventDefaultHandler)
        this.containerElement.addEventListener('dragstart', this.#thumbPreventDefaultHandler);
    }

    /** Деактивирует управление размытием на текущей странице. */
    static disable()
    {
        document.removeEventListener("keydown", this.#handleKeyDown);
        this.containerElement.removeEventListener("mousedown", this.#handleMouseDown);
        document.removeEventListener('mouseup', this.#handleMouseUp);
        this.containerElement.removeEventListener('click', this.#thumbPreventDefaultHandler)
        this.containerElement.removeEventListener('dragstart', this.#thumbPreventDefaultHandler);

        this.#overlayElement?.remove();
        this.containerElement.style = "";
        this.containerElement.classList.remove("blur");
    }

    /**
     * Привязывает внешний переключатель размытия.
     * @param {HTMLInputElement} rangeInput 
     */
    static bind(rangeInput)
    {
        if (this.#bindedRangeElement)
            this.unbind();
        else if (!this.#overlayElement) {
            this.#createOverlay();
            if (this.overlayChangeCallback)
                this.overlayChangeCallback();
        }
            
        this.#bindedRangeElement = rangeInput;
        rangeInput.addEventListener("change", this.#handleBindedRangeElementChange);
    }

     /** Отвязывает внешний переключатель размытия. */
    static unbind()
    {
        if (!this.#bindedRangeElement) return;
        this.#bindedRangeElement.removeEventListener("change", this.#handleBindedRangeElementChange);
        this.#bindedRangeElement = null;
    }


    static #createOverlay()
    {
        document.body.insertAdjacentHTML("beforeend", `
            <div id="${this.elementIDs.main}" style="text-align: center;">
                <label for="${this.elementIDs.range}">Размытие:</label><br>
                <input id="${this.elementIDs.range}" type="range" max="10" value="0" style="width: 80px;">
            </div>`);
        this.#overlayElement = document.getElementById(this.elementIDs.main);
        this.#rangeElement = document.getElementById(this.elementIDs.range);
        this.#rangeElement.onchange = event => {
            if (this.#bindedRangeElement)
                this.#bindedRangeElement.value = this.#rangeElement.value;
            this.#updateBlurring();
        };
    }

    static #updateBlurring()
    {
        const blurValue = this.#rangeElement.value;
        this.containerElement.style = `--blur: blur(${blurValue}px);`;
        this.containerElement.classList.toggle("blur", blurValue != 0);
    }

    static #handleKeyDown(e)
    {
        // Alt + B - параметры размытия
        if (e.altKey && !e.ctrlKey && !e.shiftKet && e.code == "KeyB")
            BlurringControl.overlayOn = !BlurringControl.overlayOn;
    }

    static #handleMouseDown(e)
    {
        if (!e.ctrlKey || e.button != 0) return;
        const thumb = e.target.closest(".thumb");
        if (thumb == null
            || !thumb.classList.contains("blocked") && !BlurringControl.containerElement.classList.contains("blur"))
            return;
        BlurringControl.#preventDefaultActions = true;
        BlurringControl.#tempVisibleThumb = thumb;
        BlurringControl.#tempVisibleThumb.classList.add("tempShow");
    }

    static #handleMouseUp(e)
    {
        setTimeout(() => {
            BlurringControl.#preventDefaultActions = false;
            if (!BlurringControl.#tempVisibleThumb) return;
            BlurringControl.#tempVisibleThumb.classList.remove("tempShow");
            BlurringControl.#tempVisibleThumb = null;
        }, 0);
        // console.log("mouseup", event);
    }

    static #thumbPreventDefaultHandler(e)
    {
        if (BlurringControl.#preventDefaultActions)
            e.preventDefault();
    }

    static #handleBindedRangeElementChange(e)
    {
        BlurringControl.#rangeElement.value = BlurringControl.#bindedRangeElement.value;
        BlurringControl.#updateBlurring();
    }
}