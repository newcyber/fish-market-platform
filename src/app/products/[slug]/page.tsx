import { redirect } from "next/navigation";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  redirect(
    `/customer/products/${slug}`
  );
}