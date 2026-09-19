export interface AbastecimentoConsumo {
  hodometro?: unknown;
  litros?: unknown;
  tanqueCompleto?: boolean;
  [campo: string]: unknown;
}

export function calcularConsumoMedio(
  registros: AbastecimentoConsumo[],
): number | null {
  const ordenados = registros
    .filter(
      (item) =>
        Number.isFinite(Number(item.hodometro)) &&
        Number.isFinite(Number(item.litros)) &&
        Number(item.litros) > 0,
    )
    .sort((a, b) => Number(a.hodometro) - Number(b.hodometro));

  let indiceAnteriorCompleto: number | null = null;
  let quilometrosValidos = 0;
  let litrosValidos = 0;

  ordenados.forEach((registro, indice) => {
    if (registro.tanqueCompleto !== true) return;

    if (indiceAnteriorCompleto !== null) {
      const distancia =
        Number(registro.hodometro) -
        Number(ordenados[indiceAnteriorCompleto].hodometro);
      const litrosDoIntervalo = ordenados
        .slice(indiceAnteriorCompleto + 1, indice + 1)
        .reduce((total, item) => total + Number(item.litros), 0);

      if (distancia > 0 && litrosDoIntervalo > 0) {
        quilometrosValidos += distancia;
        litrosValidos += litrosDoIntervalo;
      }
    }

    indiceAnteriorCompleto = indice;
  });

  if (quilometrosValidos <= 0 || litrosValidos <= 0) return null;
  return quilometrosValidos / litrosValidos;
}
