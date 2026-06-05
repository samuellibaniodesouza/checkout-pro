import { MercadoPagoConfig, Payment } from "mercadopago";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

console.log("MP TOKEN EXISTE?", accessToken ? "SIM" : "NÃO");
console.log("MP TOKEN COMEÇO:", accessToken?.slice(0, 15));

if (!accessToken) {
  throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado no .env");
}

const client = new MercadoPagoConfig({
  accessToken,
});

export const paymentClient = new Payment(client);