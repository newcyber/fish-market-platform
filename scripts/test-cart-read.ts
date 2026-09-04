import { prisma } from "@/lib/prisma";
import CartService from "@/services/cart/cart.service";

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      role: "CUSTOMER",
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!user) {
    throw new Error("Customer tidak ditemukan.");
  }

  console.log("USER:", user.email);

  console.log("1. getOrCreateCart...");
  await CartService.getOrCreateCart({
  type: "customer",
  userId: user.id,
});
  console.log("PASS");

  console.log("2. clearCart...");
  await CartService.clearCart({
  type: "customer",
  userId: user.id,
});
  console.log("PASS");

  console.log("3. getCart...");
  const cart = await CartService.getCart({
  type: "customer",
  userId: user.id,
});

  console.log("PASS");
  console.log(
    `Cart items: ${cart?.items.length ?? 0}`
  );
}

main()
  .catch((error) => {
    console.error("[CART_READ_TEST_ERROR]");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
