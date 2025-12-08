import { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "../database/banco-mongo.js";

// Inicializa o Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface AutenticacaoRequest extends Request {
  usuarioId?: string;
}

class PagamentoController {
  
  // 1. Criar a Sessão de Checkout (Substitui o criarPagamentoCartao antigo)
  async criarSessaoCheckout(req: AutenticacaoRequest, res: Response) {
    try {
      if (!req.usuarioId) {
        return res.status(401).json({ mensagem: "Usuário não autenticado." });
      }

      // Buscar o carrinho no banco
      const carrinho = await db.collection("carrinhos").findOne({ usuarioId: req.usuarioId });
      if (!carrinho || !carrinho.itens || carrinho.itens.length === 0) {
        return res.status(404).json({ mensagem: "Carrinho vazio ou não encontrado." });
      }

      // Mapear itens do carrinho (Mongo) para Line Items do Stripe
      const lineItems = carrinho.itens.map((item: any) => {
        return {
          price_data: {
            currency: "brl",
            product_data: {
              name: item.nome || "Produto sem nome",
            },
            // Stripe espera valor em centavos (inteiro)
            unit_amount: Math.round(item.precoUnitario * 100),
          },
          quantity: item.quantidade,
        };
      });

      // Define a URL de retorno (ajuste localhost ou produção conforme necessário)
      // O Stripe substituirá {CHECKOUT_SESSION_ID} automaticamente
      const origin = req.get("origin") || "http://localhost:5173"; 

      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        line_items: lineItems,
        mode: 'payment',
        return_url: `${origin}/return?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
            usuarioId: req.usuarioId, // Guardar ID para uso futuro (ex: webhook)
        }
      });

      // Retorna o clientSecret para o frontend montar o componente
      return res.json({ clientSecret: session.client_secret });

    } catch (err) {
      console.error("Erro ao criar sessão de checkout:", err);
      return res.status(500).json({ mensagem: "Erro ao criar pagamento." });
    }
  }

  // 2. Verificar Status da Sessão (Novo método exigido pelo exemplo)
  async verificarStatusSessao(req: Request, res: Response) {
    try {
        const { session_id } = req.query;
        
        if (!session_id || typeof session_id !== 'string') {
            return res.status(400).json({ mensagem: "Session ID inválido" });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        res.json({
            status: session.status,
            customer_email: session.customer_details?.email
        });
    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        return res.status(500).json({ mensagem: "Erro ao verificar status" });
    }
  }
}

export default new PagamentoController();