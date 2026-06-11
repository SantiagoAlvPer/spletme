export interface SelectOption {
  value: string;
  label: string;
}

export interface ReleaseFiltersOptions {
  countries: SelectOption[];
  platforms: SelectOption[];
}
