import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from "express";

interface AutenticacaoRequest extends Request {
    usuarioId?: string;
    usuarioTipo?: string;
}

function Auth(req: AutenticacaoRequest, res: Response, next: NextFunction) {
    const authHeaders = req.headers.authorization;
    if (!authHeaders)
        return res.status(401).json({ mensagem: "Token (Bearer) não fornecido." });

    const token = authHeaders.split(" ")[1];
    if (!token) {
        return res.status(401).json({ mensagem: "Token mal formatado." });
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
        if (err) {
            return res.status(401).json({ mensagem: "Token inválido ou expirado." });
        }

        if (typeof decoded !== 'object' || decoded === null || !("usuarioId" in decoded) || !("tipo" in decoded)) {
            return res.status(401).json({ mensagem: "Token com payload inválido (Faltando ID ou Tipo)." });
        }

        req.usuarioId = decoded.usuarioId;
        req.usuarioTipo = decoded.tipo;

        next();
    });
}

function checkAdmin(req: AutenticacaoRequest, res: Response, next: NextFunction) {
    if (req.usuarioTipo === 'admin') {
        next();
    } else {
        return res.status(403).json({ mensagem: "Acesso negado. Rota restrita a administradores." });
    }
}

export { Auth, checkAdmin };
