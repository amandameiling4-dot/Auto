import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../database/prisma.js";

export async function login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    if (user.status === "FROZEN") {
        throw new Error("Account frozen");
    }

    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "12h" }
    );
}
