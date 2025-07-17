class ColorPaletteElement extends HTMLElement {
  static elementName = "color-palette";

  // Define observed attributes to react to changes
  static get observedAttributes() {
    return ["primary", "accent", "secondary", "tertiary"];
  }

  constructor() {
    super();

    // Default colors
    this.colors = {
      primary: "#314B54",
      accent: "#F18B6D",
      secondary: "#103F2C",
      tertiary: "#F3D9C6",
    };

    this.copiedColor = null;
    this.copiedText = null;
  }

  // Called when the element is added to the DOM
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  // Called when attributes change
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && ["primary", "accent", "secondary", "tertiary"].includes(name)) {
      this.colors[name] = newValue;
      this.render();
    }
  }

  // Calculate lighter or darker color variation
  adjustColor(color, amount) {
    // Remove the # if present
    color = color.replace("#", "");

    // Parse the hex values
    const r = Number.parseInt(color.substring(0, 2), 16);
    const g = Number.parseInt(color.substring(2, 4), 16);
    const b = Number.parseInt(color.substring(4, 6), 16);

    // Adjust each color component
    const adjustR = Math.max(0, Math.min(255, r + amount));
    const adjustG = Math.max(0, Math.min(255, g + amount));
    const adjustB = Math.max(0, Math.min(255, b + amount));

    // Convert back to hex
    return `#${adjustR.toString(16).padStart(2, "0")}${adjustG.toString(16).padStart(2, "0")}${adjustB.toString(16).padStart(2, "0")}`;
  }

  // Generate the extended color palette
  generateExtendedPalette() {
    const baseColors = [
      {
        name: "Primary",
        hex: this.colors.primary,
        cssVar: "--color-primary",
        settingsVar: "settings.colors_primary",
        usage: "Headings, text, etc.",
      },
      {
        name: "Accent",
        hex: this.colors.accent,
        cssVar: "--color-accent",
        settingsVar: "settings.colors_accent",
        usage: "Backgrounds, borders, etc.",
      },
      {
        name: "Secondary",
        hex: this.colors.secondary,
        cssVar: "--color-secondary",
        settingsVar: "settings.colors_secondary",
        usage: "Secondary backgrounds, borders, etc.",
      },
      {
        name: "Tertiary",
        hex: this.colors.tertiary,
        cssVar: "--color-tertiary",
        settingsVar: "settings.colors_tertiary",
        usage: "Light backgrounds",
      },
    ];

    // Generate extended color palette with lighter and darker variations
    return baseColors.flatMap((color) => {
      const variations = [
        {
          ...color,
          name: `${color.name} Light`,
          hex: this.adjustColor(color.hex, 30),
          cssVar: `${color.cssVar}-light`,
          settingsVar: `${color.settingsVar}_light`,
          usage: `Hover states for ${color.name.toLowerCase()} elements`,
          isVariation: true,
        },
        color,
        {
          ...color,
          name: `${color.name} Dark`,
          hex: this.adjustColor(color.hex, -30),
          cssVar: `${color.cssVar}-dark`,
          settingsVar: `${color.settingsVar}_dark`,
          usage: `Active/pressed states for ${color.name.toLowerCase()} elements`,
          isVariation: true,
        },
      ];

      // Include all variations for all colors
      return variations;
    });
  }

  // Generate settings object for copy/paste
  generateSettingsObject() {
    const colors = this.generateExtendedPalette();
    const settingsObject = colors.reduce((acc, color) => {
      const key = color.settingsVar.split(".")[1];
      acc[key] = color.hex;
      return acc;
    }, {});

    return JSON.stringify(settingsObject, null, 2);
  }

  // Generate CSS variables
  generateCssVariables() {
    return `:root {
  --color-primary-light: {{ settings.colors_primary_light }};
  --color-primary: {{ settings.colors_primary }};
  --color-primary-dark: {{ settings.colors_primary_dark }};

  --color-accent-light: {{ settings.colors_accent_light }};
  --color-accent: {{ settings.colors_accent }};
  --color-accent-dark: {{ settings.colors_accent_dark }};

  --color-secondary-light: {{ settings.colors_secondary_light }};
  --color-secondary: {{ settings.colors_secondary }};
  --color-secondary-dark: {{ settings.colors_secondary_dark }};

  --color-tertiary-light: {{ settings.colors_tertiary_light }};
  --color-tertiary: {{ settings.colors_tertiary }};
  --color-tertiary-dark: {{ settings.colors_tertiary_dark }};
}`;
  }

  // Set up event listeners
  setupEventListeners() {
    // Copy color to clipboard
    this.querySelectorAll(".color-swatch").forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        const color = e.currentTarget.dataset.color;
        this.copyToClipboard(color);
      });
    });

    // Copy CSS variables to clipboard
    this.querySelector(".copy-css-btn").addEventListener("click", () => {
      this.copyTextToClipboard(this.generateCssVariables());
    });

    // Copy settings object to clipboard
    this.querySelector(".copy-settings-btn").addEventListener("click", () => {
      this.copyTextToClipboard(this.generateSettingsObject());
    });
  }

  // Copy color to clipboard
  copyToClipboard(color) {
    navigator.clipboard.writeText(color);
    this.copiedColor = color;

    // Update UI to show copied state
    this.querySelectorAll(".color-swatch").forEach((swatch) => {
      if (swatch.dataset.color === color) {
        const copyIndicator = swatch.querySelector(".copy-indicator");
        copyIndicator.textContent = "Copied!";
        copyIndicator.classList.remove("opacity-0");
        copyIndicator.classList.add("opacity-100");

        setTimeout(() => {
          copyIndicator.classList.remove("opacity-100");
          copyIndicator.classList.add("opacity-0");
          this.copiedColor = null;
        }, 2000);
      }
    });
  }

  // Copy text to clipboard
  copyTextToClipboard(text) {
    navigator.clipboard.writeText(text);
    this.copiedText = text;

    // Update UI to show copied state
    const copyBtn = this.querySelector(
      text === this.generateCssVariables() ? ".copy-css-btn" : ".copy-settings-btn"
    );
    const copyIndicator = copyBtn.querySelector(".copy-indicator");
    copyIndicator.textContent = "Copied!";
    copyIndicator.classList.remove("opacity-0");
    copyIndicator.classList.add("opacity-100");

    setTimeout(() => {
      copyIndicator.classList.remove("opacity-100");
      copyIndicator.classList.add("opacity-0");
      this.copiedText = null;
    }, 2000);
  }

  // Render the component
  render() {
    const colors = this.generateExtendedPalette();
    const cssVariables = this.generateCssVariables();

    this.innerHTML = `
      <div class="max-w-7xl mx-auto p-5">
        <h1 class="text-2xl font-bold mb-2">Extended Color Palette</h1>
        <p class="mb-6 text-gray-600">Including lighter variations for hover states and darker variations for active states.</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          ${colors
            .map(
              (color) => `
            <div class="color-swatch rounded-lg overflow-hidden shadow-md cursor-pointer relative" data-color="${color.hex}">
              <div class="h-24 flex items-end p-3" style="background-color: ${color.hex}">
                <div class="bg-white/90 px-2 py-1 rounded text-sm font-medium">${color.name}</div>
              </div>
              <div class="p-4 bg-white">
                <div class="flex justify-between items-center mb-1 font-mono">
                  <span>${color.hex}</span>
                  <span class="copy-indicator text-xs text-green-600 transition-opacity duration-200 opacity-0">Copied!</span>
                </div>
                <div class="font-mono text-xs text-gray-600 mb-1">${color.cssVar}</div>
                <div class="text-sm text-gray-600">${color.usage}</div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 class="text-xl font-bold mb-4">CSS Variables Implementation</h2>
          <div class="relative bg-gray-100 rounded-lg p-4 mb-5 overflow-x-auto">
            <button class="copy-css-btn absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 rounded px-3 py-1 text-sm flex items-center">
              Copy
              <span class="copy-indicator ml-1 text-xs text-green-600 transition-opacity duration-200 opacity-0">Copied!</span>
            </button>
            <pre class="font-mono text-sm whitespace-pre-wrap">${cssVariables}</pre>
          </div>
          
          <h3 class="text-lg font-bold mb-2">Usage Example</h3>
          <div class="bg-gray-100 rounded-lg p-4 overflow-x-auto">
            <pre class="font-mono text-sm whitespace-pre-wrap">.btn-primary {
              background-color: var(--color-primary);
              color: white;
            }

            .btn-primary:hover {
              background-color: var(--color-primary-light);
            }

            .btn-primary:active {
              background-color: var(--color-primary-dark);
            }

            .accent-border {
              border: 1px solid var(--color-accent);
            }

            .secondary-background {
              background-color: var(--color-secondary);
              color: white;
            }

            .tertiary-panel {
              background-color: var(--color-tertiary);
              color: var(--color-primary);
            }</pre>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-5">
          <h2 class="text-xl font-bold mb-4">Button Elements Preview</h2>
          
          <h3 class="text-lg font-bold mb-2">Primary Buttons</h3>
          <div class="flex flex-wrap gap-4 mb-6">
            <button class="px-4 py-2 rounded-md text-white" style="background-color: ${this.colors.primary};">Normal</button>
            <button class="px-4 py-2 rounded-md text-white" style="background-color: ${this.adjustColor(this.colors.primary, 30)};">Hover</button>
            <button class="px-4 py-2 rounded-md text-white" style="background-color: ${this.adjustColor(this.colors.primary, -30)};">Active</button>
          </div>
          
          <h3 class="text-lg font-bold mb-2">Accent Buttons</h3>
          <div class="flex flex-wrap gap-4 mb-6">
            <button class="px-4 py-2 rounded-md text-white" style="background-color: ${this.colors.accent};">Normal</button>
            <button class="px-4 py-2 rounded-md text-white" style="background-color: ${this.adjustColor(this.colors.accent, 30)};">Hover</button>
            <button class="px-4 py-2 rounded-md text-white" style="background-color: ${this.adjustColor(this.colors.accent, -30)};">Active</button>
          </div>

          <h3 class="text-lg font-bold mb-2">Secondary Buttons</h3>
          <div class="flex flex-wrap gap-4 mb-6">
            <button class="px-4 py-2 rounded-md text-white" style="background-color: ${this.colors.secondary};">Normal</button>
            <button class="px-4 py-2 rounded-md text-white" style="background-color: ${this.adjustColor(this.colors.secondary, 30)};">Hover</button>
            <button class="px-4 py-2 rounded-md text-white" style="background-color: ${this.adjustColor(this.colors.secondary, -30)};">Active</button>
          </div>
          
          <h3 class="text-lg font-bold mb-2">Outline Accent Buttons</h3>
          <div class="flex flex-wrap gap-4 mb-6">
            <button class="px-4 py-2 rounded-md border-2" style="border-color: ${this.colors.accent}; color: ${this.colors.accent};">Normal</button>
            <button class="px-4 py-2 rounded-md border-2" style="border-color: ${this.adjustColor(this.colors.accent, 30)}; color: ${this.adjustColor(this.colors.accent, 30)};">Hover</button>
            <button class="px-4 py-2 rounded-md border-2" style="border-color: ${this.adjustColor(this.colors.accent, -30)}; color: ${this.adjustColor(this.colors.accent, -30)};">Active</button>
          </div>
          
          <h3 class="text-lg font-bold mb-2">Cards</h3>
          <div class="flex flex-wrap gap-4">
            <div class="p-4 rounded-md w-36" style="background-color: ${this.colors.tertiary};">
              <div style="color: ${this.colors.primary};">Normal Card</div>
            </div>
            <div class="p-4 rounded-md w-36" style="background-color: ${this.adjustColor(this.colors.tertiary, 30)};">
              <div style="color: ${this.colors.primary};">Hover Card</div>
            </div>
            <div class="p-4 rounded-md w-36" style="background-color: ${this.adjustColor(this.colors.tertiary, -30)};">
              <div style="color: ${this.colors.primary};">Active Card</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Define the custom element
customElements.define(ColorPaletteElement.elementName, ColorPaletteElement);

// Export the class for potential reuse
export { ColorPaletteElement };
