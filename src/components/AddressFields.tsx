import { useEffect, useMemo, useState } from "react";
import { Field, Select, TextInput } from "./ui";

export type AddressValue = {
  cep?: string;
  address: string;
  uf?: string;
  city?: string;
};

type Props = {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
};

const STATES = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"], ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"], ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"], ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
] as const;

export default function AddressFields({ value, onChange }: Props) {
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [message, setMessage] = useState("");
  const normalizedCep = (value.cep ?? "").replace(/\D/g, "");
  const stateName = useMemo(() => STATES.find(([uf]) => uf === value.uf)?.[1] ?? "", [value.uf]);

  useEffect(() => {
    if (!value.uf) { setCities([]); return; }
    setLoadingCities(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${value.uf}/municipios`)
      .then((response) => response.ok ? response.json() as Promise<Array<{ nome: string }>> : Promise.reject(new Error("cities")))
      .then((data) => setCities(data.map((item) => item.nome).sort((a, b) => a.localeCompare(b, "pt-BR"))))
      .catch(() => { setCities([]); setMessage("Não foi possível carregar as cidades. Digite a cidade manualmente."); })
      .finally(() => setLoadingCities(false));
  }, [value.uf]);

  const lookupCep = async (cepInput = normalizedCep) => {
    const cepDigits = cepInput.replace(/\D/g, "");
    if (cepDigits.length !== 8) return;
    setLoadingCep(true);
    setMessage("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (data.erro) { setMessage("CEP não encontrado. Preencha o endereço manualmente."); return; }
      onChange({ ...value, cep: cepDigits, address: [data.logradouro, data.bairro].filter(Boolean).join(", ") || value.address, city: data.localidade || value.city, uf: data.uf || value.uf });
      setMessage("Endereço encontrado automaticamente. Confira e complete o número.");
    } catch {
      setMessage("Busca indisponível. Preencha o endereço manualmente.");
    } finally {
      setLoadingCep(false);
    }
  };

  return <div className="contents">
    <Field label="CEP" hint="Ao completar 8 dígitos, o endereço será consultado automaticamente."><TextInput value={value.cep ?? ""} onChange={(e) => { const next = e.target.value; onChange({ ...value, cep: next }); if (next.replace(/\D/g, "").length === 8) void lookupCep(next); }} onBlur={() => void lookupCep()} placeholder="00000-000" inputMode="numeric" /></Field>
    <Field label="UF"><Select value={value.uf ?? ""} onChange={(e) => onChange({ ...value, uf: e.target.value, city: "" })}><option value="">Selecione o estado</option>{STATES.map(([uf, name]) => <option key={uf} value={uf}>{uf} — {name}</option>)}</Select></Field>
    <Field label={`Cidade${stateName ? ` — ${stateName}` : ""}`}><Select value={cities.includes(value.city ?? "") ? value.city : ""} onChange={(e) => onChange({ ...value, city: e.target.value })} disabled={!value.uf || loadingCities}><option value="">{loadingCities ? "Carregando cidades…" : value.uf ? "Selecione a cidade" : "Selecione primeiro a UF"}</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</Select>{value.uf && !loadingCities && cities.length === 0 && <TextInput className="mt-2" value={value.city ?? ""} onChange={(e) => onChange({ ...value, city: e.target.value })} placeholder="Digite a cidade manualmente" />}</Field>
    <Field label="Logradouro / endereço"><TextInput value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} placeholder="Rua, número, complemento" /></Field>
    {message && <p className="sm:col-span-2 text-xs text-fog-500">{message}</p>}
  </div>;
}
