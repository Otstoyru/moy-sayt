import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import StockUploadForm from "./StockUploadForm";

export default async function AdminStockPage() {
  const staff = await requireRole(["manager", "administrator"]);
  if (!staff) redirect("/login?next=/admin/stock");

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Остатки и цены</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="text-sm font-medium text-brand hover:underline">
            Заказы →
          </Link>
          {staff.role === "administrator" && (
            <Link href="/admin/sellers" className="text-sm font-medium text-brand hover:underline">
              Юрлица →
            </Link>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        Загрузите файл «Остатки для сайта.xlsx» (лист «Лист1») — обновит остатки, цены и позиции
        каталога. Фото и привязка к юрлицу у уже существующих товаров не меняются; у новых товаров
        юрлицо нужно будет назначить вручную в «Юрлица».
      </p>
      <StockUploadForm />
    </div>
  );
}
