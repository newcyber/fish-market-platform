import { redirect } from "next/navigation";

export default function CustomerCartRedirect() {
  redirect("/cart");
}
