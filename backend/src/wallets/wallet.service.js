import prisma from "../database/prisma.js";

export async function getWallet(userId) {
    return prisma.wallet.findUnique({ where: { userId } });
}

export async function credit(userId, amount, reason) {
    return prisma.$transaction(async tx => {
        await tx.wallet.update({
            where: { userId },
            data: { balance: { increment: amount } }
        });
        await tx.auditLog.create({
            data: { actor: "SYSTEM", action: `CREDIT:${userId}:${amount}:${reason}` }
        });
    });
}

export async function debit(userId, amount) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.locked || wallet.balance < amount)
        throw new Error("Insufficient or locked");
    return prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } }
    });
}
