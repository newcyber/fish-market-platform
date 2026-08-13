import { Role } from "@prisma/client";

import CustomerService from "@/services/customer/customer.service";

async function main() {
  const customer = await CustomerService.createCustomer({
    name: "Customer Dummy",
    email: "customer.dummy@fishmarket.test",
    password: "Customer123!",
    phone: "081234567899",
    role: Role.CUSTOMER,
    isActive: true,
  });

  console.log("");
  console.log("======================================");
  console.log("✅ CUSTOMER DUMMY BERHASIL DIBUAT");
  console.log("======================================");
  console.log("");
  console.log("ID       :", customer.id);
  console.log("Nama     :", customer.name);
  console.log("Email    :", customer.email);
  console.log("Password : Customer123!");
  console.log("Phone    :", customer.phone);
  console.log("Role     :", customer.role);
  console.log("Status   :", customer.isActive);
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ GAGAL MEMBUAT CUSTOMER DUMMY");
    console.error(error);
    process.exit(1);
  });