// Categorías base. Además se incluyen automáticamente las que ya existan en los productos y las que el administrador cree.
export const NUEVA = "__nueva__";
const BASE = ["Semillas", "Fertilizantes", "Plaguicidas", "Herbicidas", "Fungicidas", "Insecticidas", "Abonos orgánicos", "Herramientas", "Maquinaria y equipos", "Sistemas de riego", "Envases y embalajes", "Equipos de protección (EPP)", "Alimento para animales"];
export const categoriasDe = (lista = []) => {
  const extra = [...new Set(lista.map(p => (p.categoria || "").trim()).filter(c => c && c !== "Otros" && !BASE.includes(c)))].sort((a, b) => a.localeCompare(b, "es"));
  return [...BASE, ...extra, "Otros"];
};
