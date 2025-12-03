import { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "../database/banco-mongo.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface AutenticacaoRequest extends Request {
  usuarioId?: string;
}

class PagamentoController {
  async criarPagamentoCartao(req: AutenticacaoRequest, res: Response) {
    try {
      // Verifica autenticação
      if (!req.usuarioId) {
        return res.status(401).json({ mensagem: "Usuário não autenticado." });
      }

      // Buscar o carrinho do usuário no banco (o carrinho é fonte de verdade do total)
      const carrinho = await db.collection("carrinhos").findOne({ usuarioId: req.usuarioId });
      if (!carrinho) {
        return res.status(404).json({ mensagem: "Carrinho não encontrado." });
      }

      // Garantir que total exista e seja número
      const totalNumber = Number(carrinho.total || 0);
      if (!isFinite(totalNumber) || totalNumber <= 0) {
        return res.status(400).json({ mensagem: "Total do carrinho inválido." });
      }


      const amountInCents = Math.round(totalNumber * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "brl",
        payment_method_types: ["card"],
        metadata: {
          pedido_id: req.body?.pedidoId || req.usuarioId,
        },
      });

      return res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      console.error(err);
      if (err instanceof Error) return res.status(500).json({ mensagem: err.message });
      return res.status(500).json({ mensagem: "Erro de pagamento desconhecido!" });
    }
  }
}

export default new PagamentoController();
