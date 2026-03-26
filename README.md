# react-pdf-form-preview

[![npm version](https://img.shields.io/npm/v/react-pdf-form-preview.svg)](https://www.npmjs.com/package/react-pdf-form-preview)
[![npm downloads](https://img.shields.io/npm/dm/react-pdf-form-preview.svg)](https://www.npmjs.com/package/react-pdf-form-preview)
[![license](https://img.shields.io/npm/l/react-pdf-form-preview.svg)](LICENSE)

**[Live Demo](https://yago85.github.io/react-pdf-form-preview)** · [English](#english) | [Русский](#русский)

---

## English

**Fill PDF form fields and preview the result in real time** — a single React component for documents, contracts, invoices, and any fillable PDF template.

Load a PDF with AcroForm fields, pass your form data, and the component renders a live canvas preview that updates as the user types. Built on top of [pdf-lib](https://github.com/Hopding/pdf-lib) and [pdfjs-dist](https://github.com/mozilla/pdf.js). Works with Next.js, Vite, and any React 18+ project. TypeScript-first.

### Why this package?

There is no single library that lets you **fill a PDF template and show a live preview** in React. Existing tools solve only part of the problem:

| Library | Fills fields | Live preview | React component |
|---------|:---:|:---:|:---:|
| pdf-lib | yes | — | — |
| react-pdf | — | yes | yes |
| pdfjs-dist | — | yes | — |
| **react-pdf-form-preview** | **yes** | **yes** | **yes** |

### Key features

- **Fill PDF forms** — text fields, checkboxes, and dropdowns from a JSON-like object
- **Live preview on canvas** — see changes as the user types, no page reload
- **Double-buffered rendering** — pages render off-screen, then swap in one frame — zero flicker
- **Field highlight overlay** — visual layer over the canvas: blue = active, yellow = filled, grey = empty
- **Inline editing** — double-click a field in the preview to edit it directly in the PDF
- **Download filled PDF** — get the filled PDF as `Uint8Array` to download or send to a server
- **Custom fonts** — embed any `.ttf` / `.woff2` font (Cyrillic, CJK, Arabic, etc.)
- **Retina / HiDPI** — sharp rendering on high-DPI screens
- **Multi-page PDFs** — all pages render automatically; show only specific pages with `visiblePages`
- **Data transformer** — split long text across multiple fields using real font metrics
- **Next.js / Vite / CRA** — works in any React 18+ environment
- **TypeScript** — full type coverage, strict mode
- **Zero CSS dependencies** — fully inline styles, no CSS imports needed

### Use cases

- **Contract / agreement generator** — fill a PDF template with buyer/seller data and preview before signing
- **Invoice builder** — generate invoices from a PDF template with live preview
- **Government forms** — fill official PDF forms with AcroForm fields
- **Document management systems** — preview filled documents in CRM/ERP
- **PDF form builder** — let users map form fields to PDF fields and see the result

### Install

```bash
npm install react-pdf-form-preview pdf-lib pdfjs-dist @pdf-lib/fontkit
```

Then copy the pdf.js worker to your `public/` folder (Next.js / Vite):

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/
```

### Usage with Next.js App Router

This component uses browser APIs (`canvas`, `fetch`, `Worker`) and must run on the client. Wrap it in a `"use client"` component:

```tsx
"use client";
import AcroFormPreview from "react-pdf-form-preview";

export default function PdfPreview() {
  return (
    <AcroFormPreview
      templateUrl="/templates/contract.pdf"
      workerSrc="/pdf.worker.min.mjs"
      data={{ buyer_name: "John Smith" }}
      highlightAllFields
    />
  );
}
```

### Basic usage

```tsx
import AcroFormPreview from "react-pdf-form-preview";

export default function MyPage() {
  return (
    <AcroFormPreview
      templateUrl="/templates/contract.pdf"
      workerSrc="/pdf.worker.min.mjs"
      data={{
        buyer_name: "John Smith",
        contract_date: "01.01.2025",
        price: "150 000",
      }}
      highlightAllFields
    />
  );
}
```

> **Note:** Callback props (`onPdfGenerated`, `dataTransformer`, `onFieldClick`, etc.) are stabilized internally via refs — you don't need to wrap them in `useCallback`.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `templateUrl` | `string` | — | URL to fetch the PDF template |
| `templateBuffer` | `ArrayBuffer` | — | Direct buffer — avoids a repeated fetch |
| `data` | `Record<string, string \| number \| boolean \| null>` | **required** | Field values |
| `dataTransformer` | `DataTransformer` | — | Transform `data` before filling (multiline split, number-to-words, etc.) |
| `fieldMapping` | `Record<string, string>` | — | Simple 1-to-1 map: `formFieldName → pdfFieldName` |
| `workerSrc` | `string` | — | Path to `pdf.worker.min.mjs` (if omitted, configure `pdfjsLib.GlobalWorkerOptions.workerSrc` yourself) |
| `fontSrc` | `string` | Roboto (Google Fonts CDN) | URL/path to a `.ttf` or `.woff2` font |
| `fontSize` | `number` | `8` | Font size in pt for text fields |
| `scale` | `number` | `1.5` | Canvas render scale |
| `maxWidth` | `string` | `"810px"` | CSS `max-width` of the container |
| `debounceMs` | `number` | `200` | Debounce before re-render when data changes |
| `highlightAllFields` | `boolean` | `false` | Auto-highlight all AcroForm fields |
| `activeField` | `string` | — | Field name highlighted in blue (focused) |
| `hiddenFields` | `Set<string>` | — | Fields excluded from auto-highlighting |
| `highlightFields` | `FieldHighlight[]` | — | Manual highlight list `{ fieldName, color }` |
| `showLabels` | `boolean` | — | Show field names inside highlight boxes |
| `visiblePages` | `number[]` | all | Render only these pages (1-based) |
| `onFieldClick` | `(fieldName: string) => void` | — | Click on a highlighted field |
| `onFieldDoubleClick` | `(fieldName, rect) => void` | — | Double-click on a field |
| `onFieldRectsReady` | `(rects: Map<...>) => void` | — | Field coordinates after first render |
| `onPageSizesReady` | `(sizes: Map<...>) => void` | — | Page sizes in PDF points after first render |
| `onPdfGenerated` | `(bytes: Uint8Array) => void` | — | Filled PDF bytes after every render |
| `renderPageOverlay` | `(pageNum: number) => ReactNode` | — | Custom overlay slot per page |
| `fieldsRequiringRecalculation` | `string[]` | — | Fields that trigger multiline width recalculation |
| `className` | `string` | `""` | Extra class on the root element |

### Examples

#### Example 1 — Basic

```tsx
<AcroFormPreview
  templateUrl="/templates/contract.pdf"
  workerSrc="/pdf.worker.min.mjs"
  data={{ buyer_name: "John Smith", contract_date: "01.01.2025" }}
  highlightAllFields
/>
```

#### Example 2 — Active field (form + preview side by side)

```tsx
const [activeField, setActiveField] = useState<string>();

<AcroFormPreview
  templateUrl="/templates/contract.pdf"
  workerSrc="/pdf.worker.min.mjs"
  data={formData}
  activeField={activeField}
  highlightAllFields
/>

// in your form inputs:
onFocus={() => setActiveField("buyer_name")}
onBlur={() => setActiveField(undefined)}
```

#### Example 3 — Data transformer (multiline text)

```tsx
const transformer: DataTransformer = (data, options) => {
  const { font, fontSize = 8, fieldWidthPt = 400 } = options ?? {};
  // split data.full_address into address_line_1 / address_line_2 using font metrics
  return { ...data, address_line_1: "...", address_line_2: "..." };
};

<AcroFormPreview
  templateUrl="/templates/contract.pdf"
  workerSrc="/pdf.worker.min.mjs"
  data={formData}
  dataTransformer={transformer}
  fieldsRequiringRecalculation={["full_address"]}
/>
```

#### Example 4 — Download filled PDF

```tsx
const filledBytesRef = useRef<Uint8Array | null>(null);

<AcroFormPreview
  templateBuffer={templateBuffer}
  workerSrc="/pdf.worker.min.mjs"
  data={formData}
  onPdfGenerated={(bytes) => { filledBytesRef.current = bytes; }}
/>

// later:
const blob = new Blob([filledBytesRef.current!], { type: "application/pdf" });
```

#### Example 5 — Inline editing (click-to-edit directly in the PDF)

Double-click any highlighted field in the PDF preview to edit it in place — no separate form required.

```tsx
interface InlineEditorState {
  fieldName: string;
  rect: { left: number; top: number; width: number; height: number };
}

function InlineEditor({ state, value, onChange, onClose }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 30); }, []);

  return (
    <div style={{ position: "absolute", left: `${state.rect.left}%`, top: `${state.rect.top}%`, width: `${state.rect.width}%`, height: `${state.rect.height}%`, zIndex: 10 }}>
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onClose}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") onClose(); }}
        style={{ width: "100%", height: "100%", border: "2px solid #3b82f6", outline: "none", fontSize: 11, boxSizing: "border-box" }}
      />
    </div>
  );
}

export default function InlineEditingExample() {
  const [formData, setFormData] = useState({ buyer_name: "John Smith" });
  const [editor, setEditor] = useState<InlineEditorState | null>(null);
  const [activeField, setActiveField] = useState<string | undefined>();

  return (
    <div style={{ position: "relative" }}>
      <AcroFormPreview
        templateUrl="/templates/contract.pdf"
        workerSrc="/pdf.worker.min.mjs"
        data={formData}
        activeField={activeField}
        highlightAllFields
        onFieldDoubleClick={(fieldName, rect) => {
          setEditor({ fieldName, rect });
          setActiveField(fieldName);
        }}
      />
      {editor && (
        <InlineEditor
          state={editor}
          value={(formData as any)[editor.fieldName] ?? ""}
          onChange={(v) => setFormData((prev) => ({ ...prev, [editor.fieldName]: v }))}
          onClose={() => { setEditor(null); setActiveField(undefined); }}
        />
      )}
    </div>
  );
}
```

> See the **[Live Demo](https://yago85.github.io/react-pdf-form-preview)** for an interactive version of all 5 examples.

### How double-buffering works

Every time `data` changes (after debounce):

1. `pdf-lib` fills the AcroForm fields and saves the result as `Uint8Array`
2. `pdfjs-dist` loads the buffer and renders every page to an **off-screen** `<canvas>`
3. A single `requestAnimationFrame` copies all off-screen canvases to the **visible** canvases at once
4. The active buffer label flips (`"A"` ↔ `"B"`) — the old canvas stays visible until the new one is fully ready

The user never sees a blank or partially-drawn frame between updates.

### License

[MIT](LICENSE) © Aleksey Kartsev

---

## Русский

**Заполняйте поля PDF-шаблона и показывайте результат в реальном времени** — один React-компонент для договоров, счетов, актов и любых заполняемых PDF-документов.

Загрузите PDF с AcroForm-полями, передайте данные формы — компонент отрисует live-превью на canvas, обновляющееся при каждом нажатии клавиши. Построен на [pdf-lib](https://github.com/Hopding/pdf-lib) и [pdfjs-dist](https://github.com/mozilla/pdf.js). Работает с Next.js, Vite и любым React 18+ проектом. TypeScript из коробки.

### Зачем этот пакет?

Не существует единой библиотеки, которая позволяет **заполнить PDF-шаблон и показать живой предпросмотр** в React. Существующие решения закрывают лишь часть задачи:

| Библиотека | Заполняет поля | Live-превью | React-компонент |
|------------|:---:|:---:|:---:|
| pdf-lib | да | — | — |
| react-pdf | — | да | да |
| pdfjs-dist | — | да | — |
| **react-pdf-form-preview** | **да** | **да** | **да** |

### Ключевые возможности

- **Заполнение PDF-форм** — текстовые поля, чекбоксы и выпадающие списки из JSON-объекта
- **Живой предпросмотр на canvas** — изменения видны сразу при вводе, без перезагрузки
- **Двойная буферизация рендеринга** — страницы рисуются за кадром и подменяются за один кадр — без мерцания
- **Overlay-подсветка полей** — визуальный слой поверх canvas: синий = активное, жёлтый = заполнено, серый = пусто
- **Инлайн-редактирование** — двойной клик по полю в превью для редактирования прямо в PDF
- **Скачивание заполненного PDF** — получите `Uint8Array` для скачивания или отправки на сервер
- **Произвольные шрифты** — подключите любой `.ttf` / `.woff2` (кириллица, CJK, арабский и др.)
- **Retina / HiDPI** — чёткий рендеринг на экранах высокой плотности
- **Многостраничные PDF** — все страницы рендерятся автоматически; показ выбранных страниц через `visiblePages`
- **Data transformer** — разбивка длинного текста по нескольким полям с учётом метрик шрифта
- **Next.js / Vite / CRA** — работает в любом React 18+ окружении
- **TypeScript** — полная типизация, strict mode
- **Без CSS-зависимостей** — только inline-стили, никаких CSS-импортов

### Сценарии использования

- **Генератор договоров** — заполните PDF-шаблон данными покупателя/продавца и покажите превью перед подписанием
- **Конструктор счетов** — создавайте счета из PDF-шаблона с живым предпросмотром
- **Государственные формы** — заполняйте официальные PDF-бланки с AcroForm-полями
- **Системы документооборота** — предпросмотр заполненных документов в CRM/ERP
- **Конструктор PDF-форм** — позвольте пользователям связать поля формы с полями PDF и увидеть результат

### Установка

```bash
npm install react-pdf-form-preview pdf-lib pdfjs-dist @pdf-lib/fontkit
```

Скопируйте воркер pdf.js в папку `public/` (Next.js / Vite):

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/
```

### Использование с Next.js App Router

Компонент использует браузерные API (`canvas`, `fetch`, `Worker`) и должен работать на клиенте. Оберните в `"use client"`:

```tsx
"use client";
import AcroFormPreview from "react-pdf-form-preview";

export default function PdfPreview() {
  return (
    <AcroFormPreview
      templateUrl="/templates/dogovor.pdf"
      workerSrc="/pdf.worker.min.mjs"
      data={{ buyer_name: "Иванов И.И." }}
      highlightAllFields
    />
  );
}
```

### Базовый пример

```tsx
import AcroFormPreview from "react-pdf-form-preview";

export default function MyPage() {
  return (
    <AcroFormPreview
      templateUrl="/templates/dogovor.pdf"
      workerSrc="/pdf.worker.min.mjs"
      data={{
        buyer_name: "Иванов Иван Иванович",
        contract_date: "01.01.2025",
        price: "150 000",
      }}
      highlightAllFields
    />
  );
}
```

> **Примечание:** Колбэк-пропсы (`onPdfGenerated`, `dataTransformer`, `onFieldClick` и др.) стабилизированы внутри через refs — не нужно оборачивать их в `useCallback`.

### Пропсы

| Проп | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `templateUrl` | `string` | — | URL для загрузки PDF-шаблона |
| `templateBuffer` | `ArrayBuffer` | — | Буфер шаблона напрямую — без повторного fetch |
| `data` | `Record<string, string \| number \| boolean \| null>` | **обязательный** | Значения полей |
| `dataTransformer` | `DataTransformer` | — | Трансформация данных перед заполнением |
| `fieldMapping` | `Record<string, string>` | — | Маппинг 1-к-1: `поле_формы → поле_pdf` |
| `workerSrc` | `string` | — | Путь к `pdf.worker.min.mjs` (если не задан — настройте `pdfjsLib.GlobalWorkerOptions.workerSrc` самостоятельно) |
| `fontSrc` | `string` | Roboto с CDN | Путь к шрифту `.ttf` / `.woff2` |
| `fontSize` | `number` | `8` | Размер шрифта в pt |
| `scale` | `number` | `1.5` | Масштаб рендеринга canvas |
| `maxWidth` | `string` | `"810px"` | CSS `max-width` контейнера |
| `debounceMs` | `number` | `200` | Задержка перед повторным рендером |
| `highlightAllFields` | `boolean` | `false` | Автоподсветка всех AcroForm-полей |
| `activeField` | `string` | — | Активное поле (синяя подсветка) |
| `hiddenFields` | `Set<string>` | — | Поля, исключённые из подсветки |
| `highlightFields` | `FieldHighlight[]` | — | Ручная подсветка `{ fieldName, color }` |
| `showLabels` | `boolean` | — | Показывать имена полей в overlay |
| `visiblePages` | `number[]` | все | Показывать только эти страницы (с 1) |
| `onFieldClick` | `(fieldName: string) => void` | — | Клик по полю в overlay |
| `onFieldDoubleClick` | `(fieldName, rect) => void` | — | Двойной клик по полю |
| `onFieldRectsReady` | `(rects: Map<...>) => void` | — | Координаты полей после первого рендера |
| `onPageSizesReady` | `(sizes: Map<...>) => void` | — | Размеры страниц в PDF-точках после первого рендера |
| `onPdfGenerated` | `(bytes: Uint8Array) => void` | — | Заполненный PDF после каждого рендера |
| `renderPageOverlay` | `(pageNum: number) => ReactNode` | — | Произвольный overlay на каждую страницу |
| `fieldsRequiringRecalculation` | `string[]` | — | Поля, при изменении которых пересчитывается ширина |
| `className` | `string` | `""` | Дополнительный класс на корневой элемент |

### Примеры

#### Пример 1 — Базовый

```tsx
<AcroFormPreview
  templateUrl="/templates/dogovor.pdf"
  workerSrc="/pdf.worker.min.mjs"
  data={{ buyer_name: "Иванов И.И.", contract_date: "01.01.2025" }}
  highlightAllFields
/>
```

#### Пример 2 — Активное поле (форма + предпросмотр рядом)

```tsx
const [activeField, setActiveField] = useState<string>();

<AcroFormPreview
  templateUrl="/templates/dogovor.pdf"
  workerSrc="/pdf.worker.min.mjs"
  data={formData}
  activeField={activeField}
  highlightAllFields
/>

// в инпутах формы:
onFocus={() => setActiveField("buyer_name")}
onBlur={() => setActiveField(undefined)}
```

#### Пример 3 — DataTransformer (многострочный текст)

```tsx
const transformer: DataTransformer = (data, options) => {
  const { font, fontSize = 8, fieldWidthPt = 400 } = options ?? {};
  // разбиваем длинный адрес на строки с учётом реальной ширины шрифта
  return { ...data, address_1: "...", address_2: "..." };
};

<AcroFormPreview
  templateUrl="/templates/dogovor.pdf"
  workerSrc="/pdf.worker.min.mjs"
  data={formData}
  dataTransformer={transformer}
  fieldsRequiringRecalculation={["address"]}
/>
```

#### Пример 4 — Скачать заполненный PDF

```tsx
const filledBytesRef = useRef<Uint8Array | null>(null);

<AcroFormPreview
  templateBuffer={templateBuffer}
  workerSrc="/pdf.worker.min.mjs"
  data={formData}
  onPdfGenerated={(bytes) => { filledBytesRef.current = bytes; }}
/>

// при нажатии на кнопку:
const blob = new Blob([filledBytesRef.current!], { type: "application/pdf" });
```

#### Пример 5 — Инлайн-редактирование (редактировать прямо в PDF)

Двойной клик по любому подсвеченному полю в превью открывает инпут прямо поверх поля — отдельная форма не нужна.

```tsx
export default function InlineEditingExample() {
  const [formData, setFormData] = useState({ buyer_name: "Иванов И.И." });
  const [editor, setEditor] = useState(null);
  const [activeField, setActiveField] = useState(undefined);

  return (
    <div style={{ position: "relative" }}>
      <AcroFormPreview
        templateUrl="/templates/dogovor.pdf"
        workerSrc="/pdf.worker.min.mjs"
        data={formData}
        activeField={activeField}
        highlightAllFields
        onFieldDoubleClick={(fieldName, rect) => {
          setEditor({ fieldName, rect });
          setActiveField(fieldName);
        }}
      />
      {editor && (
        <InlineEditor
          state={editor}
          value={formData[editor.fieldName] ?? ""}
          onChange={(v) => setFormData((prev) => ({ ...prev, [editor.fieldName]: v }))}
          onClose={() => { setEditor(null); setActiveField(undefined); }}
        />
      )}
    </div>
  );
}
```

> Смотри **[Live Demo](https://yago85.github.io/react-pdf-form-preview)** — интерактивные версии всех 5 примеров.

### Как работает двойная буферизация

При каждом изменении `data` (после дебаунса):

1. `pdf-lib` заполняет AcroForm-поля и сохраняет PDF в `Uint8Array`
2. `pdfjs-dist` загружает буфер и рендерит каждую страницу в **скрытый** `<canvas>`
3. Один `requestAnimationFrame` копирует все скрытые canvas на **видимые** за один проход
4. Метка активного буфера переключается (`"A"` ↔ `"B"`) — старый canvas остаётся видимым до готовности нового

Пользователь никогда не видит пустого или наполовину отрисованного кадра.

### Лицензия

[MIT](LICENSE) © Aleksey Kartsev
