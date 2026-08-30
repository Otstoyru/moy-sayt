export const ORG_FORMS = [
  { value: "individual", label: "Физическое лицо" },
  { value: "self_employed", label: "Самозанятый" },
  { value: "ip", label: "ИП" },
  { value: "ooo", label: "ООО" },
  { value: "other", label: "Другое" },
] as const;

export type OrgForm = (typeof ORG_FORMS)[number]["value"];

export function orgFormLabel(value: string): string {
  return ORG_FORMS.find((f) => f.value === value)?.label ?? value;
}
