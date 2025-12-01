// pagamentos.controller.ts
import { Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

class PagamentoController {
  async criarPagamentoCartao(req: Request, res: Response) {
    try {
      // Aqui você pega o carrinho do usuário autenticado (req.user etc)
      // e calcula o valor real:
      // const amount = carrinho.total * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 5000, // valor em centavos (R$ 50,00)
        currency: "brl",
        payment_method_types: ["card"],
        metadata: {
          pedido_id: "123",
        },
      });

      return res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (err) {
      console.log(err);
      if (err instanceof Error)
        return res.status(400).json({ mensagem: err.message });
      return res.status(400).json({ mensagem: "Erro de pagamento desconhecido!" });
    }
  }
}

export default new PagamentoController();
