// Language switcher — segmented EN | বাংলা toggle.
// Lives in the dashboard header next to the "Live Site" button.
// Uses the useLanguage() hook to read and update the active language.

import { useLanguage, type Language } from "../i18n/LanguageContext";
import { Languages } from "lucide-react";

const options: Array<{ value: Language; label: string; aria: string }> = [
  { value: "en", label: "EN", aria: "Switch to English" },
  { value: "bn", label: "বাংলা", aria: "বাংলায় পরিবর্তন করুন" },
];

export function LangSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className="flex items-center gap-1 p-0.5 rounded-lg border border-slate-200 bg-white shadow-sm"
      role="group"
      aria-label={t("languageSwitch")}
      title={t("languageSwitch")}
    >
      <span className="pl-1.5 pr-1 text-slate-400 flex items-center" aria-hidden="true">
        <Languages className="w-3.5 h-3.5" />
      </span>
      {options.map(opt => {
        const active = opt.value === language;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLanguage(opt.value)}
            aria-label={opt.aria}
            aria-pressed={active}
            className={[
              "px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wide transition-all",
              "focus:outline-none focus:ring-2 focus:ring-orange-400/60",
              active
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default LangSwitcher;
