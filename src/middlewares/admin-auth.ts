// import { Request, Response, NextFunction } from "express";
// import Auth from "./auth";

// interface AdminRequest extends Request {
//     isAdmin?: boolean;
// }

// function AdminAuth(req: AdminRequest, res: Response, next: NextFunction) {
//     // Primeiro passa pelo middleware de autenticação normal
//     Auth(req, res, () => {
//         // Depois verifica se é admin
//         if (!req.isAdmin) {
//             return res.status(403).json({ mensagem: "Acesso negado. Apenas administradores podem acessar esta rota." });
//         }
//         next();
//     });
// }

// export default AdminAuth;