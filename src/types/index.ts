export interface Moto {
  id: string;
  marca: string;
  modelo: string;
  apelido?: string;
  ano?: string;
  hodometro: number | string;
  kmAtual?: number | string;
  fotoUri?: string;
}
