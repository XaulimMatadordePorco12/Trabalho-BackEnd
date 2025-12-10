import { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "../database/banco-mongo.js"; // Ajuste o caminho se necessário
import { ObjectId } from "bson";

// IMPORTANTE: Configure isso no seu arquivo .env como STRIPE_SECRET_KEY
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

interface AutenticacaoRequest extends Request {
    usuarioId?: string;
}

class PagamentoController {
    async criarIntencaoPagamento(req: AutenticacaoRequest, res: Response) {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ mensagem: "Usuário não autenticado." });
            }

            // 1. Buscar o carrinho do usuário para garantir o valor correto
            const carrinho = await db.collection("carrinhos").findOne({ usuarioId: usuarioId });

            if (!carrinho || carrinho.itens.length === 0) {
                return res.status(400).json({ mensagem: "Carrinho vazio ou não encontrado." });
            }

            // 2. Calcular o total (embora já tenha no carrinho.total, é mais seguro recalcular ou validar)
            // O Stripe trabalha com CENTAVOS (inteiros). R$ 50,00 vira 5000.
            const valorEmCentavos = Math.round(carrinho.total * 100);

            if (valorEmCentavos < 50) { // O Stripe exige um valor mínimo (geralmente 50 centavos de dólar/real)
                return res.status(400).json({ mensagem: "Valor muito baixo para processamento." });
            }

            // 3. Criar o PaymentIntent no Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: valorEmCentavos,
                currency: "brl",
                payment_method_types: ["card"],
                metadata: {
                    usuarioId: usuarioId,
                    // pode adicionar ids dos produtos aqui se quiser
                },
            });

            // 4. Retornar o clientSecret para o frontend
            return res.json({
                clientSecret: paymentIntent.client_secret,
            });

        } catch (error: any) {
            console.error("Erro no pagamento:", error);
            return res.status(500).json({ mensagem: "Erro ao processar pagamento", erro: error.message });
        }
    }
}

export default new PagamentoController();