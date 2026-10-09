/*
|--------------------------------------------------------------------------
| COMPOSANTS FORMULAIRE
|--------------------------------------------------------------------------
*/


import {useState} from "react";
import {ChevronUp,ChevronDown,Check} from "lucide-react";

export function FilterSection({
                           title,
                           icon: Icon,
                           children,
                           defaultOpen = false,
                       }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200">
            <button
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center gap-2 px-3 py-3 text-left hover:bg-slate-50"
            >
                <Icon size={15} className="text-slate-500" />

                <span className="flex-1 text-xs font-semibold text-slate-800">
          {title}
        </span>

                {open ? (
                    <ChevronUp size={14} />
                ) : (
                    <ChevronDown size={14} />
                )}
            </button>

            {open && (
                <div className="border-t border-slate-100 p-3">
                    {children}
                </div>
            )}
        </section>
    );
}

export function SectionTitle({ icon: Icon, title }) {
    return (
        <div className="mb-2 flex items-center gap-2">
            <Icon size={15} className="text-slate-500" />
            <h3 className="text-xs font-bold text-slate-800">
                {title}
            </h3>
        </div>
    );
}

export function InputField({
                        label,
                        value,
                        onChange,
                        type = "text",
                    }) {
    return (
        <label className="block">
      <span className="mb-1 block text-[9px] font-medium text-slate-500">
        {label}
      </span>

            <input
                type={type}
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 outline-none focus:border-green-500"
            />
        </label>
    );
}

export function SelectField({
                         label,
                         value,
                         onChange,
                         options,
                     }) {
    return (
        <label className="block">
      <span className="mb-1 block text-[9px] font-medium text-slate-500">
        {label}
      </span>

            <select
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-700 outline-none focus:border-green-500"
            >
                <option value="">Tous</option>

                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

export function CheckOption({
                         label,
                         checked,
                         onChange,
                     }) {
    return (
        <button
            onClick={onChange}
            className={`flex items-center gap-2 rounded-lg border p-2 text-left ${
                checked
                    ? "border-green-300 bg-green-50"
                    : "border-slate-200"
            }`}
        >
      <span
          className={`flex h-4 w-4 items-center justify-center rounded border ${
              checked
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-slate-300 bg-white"
          }`}
      >
        {checked && <Check size={10} />}
      </span>

            <span className="text-[10px] text-slate-600">
        {label}
      </span>
        </button>
    );
}

