class BlurringControl
{
    static containerElement;
    /** Функция, вызываемая после изменения свойства overlayOn. */
    static overlayChangeCallback = null;
    static #overlayOn = false;
    static #tempVisibleThumb;
    static #preventDefaultActions;


    /**
     * Задает или возращает значение, указывающее, включено ли окошко управления размытием.
     * @param {boolean} value
     */
    static set overlayOn(value)
    {
        this.#overlayOn = value;
        if (!document.getElementById("blurOverlay")) {
            document.body.insertAdjacentHTML("beforeend", `
                <div id="blurOverlay" style="text-align: center;">
                    <label for="blurRangeOverlay">Размытие:</label><br>
                    <input id="blurRangeOverlay" type="range" max="10" value="0" style="width: 80px;">
                </div>`);
            blurRangeOverlay.onchange = event => {
                const blurValue = blurRangeOverlay.value;
                BlurringControl.containerElement.style = `--blur: blur(${blurValue}px);`;
                BlurringControl.containerElement.classList.toggle("blur", blurValue != 0)
            }
        }
        blurOverlay.hidden = !this.#overlayOn;
        if (this.overlayChangeCallback)
            this.overlayChangeCallback();
    }

    static get overlayOn()
    {
        return this.#overlayOn;
    }


    static enable()
    {
        this.containerElement ??= document.body;
        document.addEventListener("keydown", this.#handleKeyDown);
        this.containerElement.addEventListener("mousedown", this.#handleMouseDown);
        document.addEventListener('mouseup', this.#handleMouseUp);
        this.containerElement.addEventListener('click', this.#thumbPreventDefaultHandler)
        this.containerElement.addEventListener('dragstart', this.#thumbPreventDefaultHandler);
    }

    static disable()
    {
        document.removeEventListener("keydown", this.#handleKeyDown);
        this.containerElement.removeEventListener("mousedown", this.#handleMouseDown);
        document.removeEventListener('mouseup', this.#handleMouseUp);
        this.containerElement.removeEventListener('click', this.#thumbPreventDefaultHandler)
        this.containerElement.removeEventListener('dragstart', this.#thumbPreventDefaultHandler);

        document.querySelector("#blurOverlay")?.remove();
        this.containerElement.style = "";
        this.containerElement.classList.remove("blur");
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
}