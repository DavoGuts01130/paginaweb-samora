import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminDashboardView from "@/components/AdminDashboardView";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    range?: string;
  }>;
};

type StoreOrderItem = {
  product_name: string;
  unit_price_cop: number | null;
  quantity: number | null;
  total_cop: number | null;
};

type StoreOrder = {
  id: string;
  order_code: string | null;
  customer_name: string | null;
  created_at: string;
  total_cop: number | null;
  status: string | null;
  payment_status: string | null;
  store_order_items?: StoreOrderItem[] | null;
};

type DashboardProduct = {
  id: string;
  name: string | null;
  stock: number | null;
  price: number | null;
  has_variants: boolean | null;
};

type DashboardVariant = {
  product_id: string;
  stock: number | null;
  price_cop: number | null;
  is_active: boolean | null;
};

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getStartDate(range: string) {
  const now = new Date();

  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "year") return new Date(now.getFullYear(), 0, 1);

  return new Date(2000, 0, 1);
}

function isClosedSale(order: StoreOrder) {
  return order.status === "delivered" || order.status === "completed";
}

function getDashboardStatus(status: string | null | undefined) {
  if (status === "cancelled") return "cancelado";
  if (status === "delivered" || status === "completed") return "entregado";
  if (status === "paid" || status === "preparing" || status === "ready") {
    return "en proceso";
  }
  return "pendiente";
}

function getProductDashboardStock(
  product: DashboardProduct,
  variants: DashboardVariant[]
) {
  if (product.has_variants) {
    const productVariants = variants.filter(
      (variant) => variant.product_id === product.id && variant.is_active !== false
    );

    if (productVariants.length > 0) {
      return productVariants.reduce(
        (sum, variant) => sum + Math.max(Number(variant.stock ?? 0), 0),
        0
      );
    }
  }

  return Math.max(Number(product.stock ?? 0), 0);
}

function getProductDashboardPrice(
  product: DashboardProduct,
  variants: DashboardVariant[]
) {
  if (product.has_variants) {
    const prices = variants
      .filter(
        (variant) =>
          variant.product_id === product.id &&
          variant.is_active !== false &&
          Number(variant.price_cop ?? 0) > 0
      )
      .map((variant) => Number(variant.price_cop ?? 0));

    if (prices.length > 0) return Math.min(...prices);
  }

  return Number(product.price ?? 0);
}

export default async function AdminDashboard({ searchParams }: Props) {
  const params = await searchParams;
  const selectedRange = ["week", "month", "year", "all"].includes(
    params.range ?? ""
  )
    ? params.range!
    : "week";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/");

  const [
    { count: projectsCount },
    { count: imagesCount },
    { count: categoriesCount },
    { data: storeOrdersData },
    { data: allQuotes },
    { data: recentProjects },
    { data: projectsByCategory },
    { data: productsData },
    { data: variantsData },
  ] = await Promise.all([
    supabase.from("portfolio_projects").select("*", { count: "exact", head: true }),
    supabase.from("portfolio_images").select("*", { count: "exact", head: true }),
    supabase.from("portfolio_categories").select("*", { count: "exact", head: true }),
    supabase
      .from("store_orders")
      .select(`
        id,
        order_code,
        customer_name,
        created_at,
        total_cop,
        status,
        payment_status,
        store_order_items (
          product_name,
          unit_price_cop,
          quantity,
          total_cop
        )
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("quote_requests")
      .select("id, status, requires_travel_review, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("portfolio_projects")
      .select("id, title, created_at, portfolio_categories(name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("portfolio_categories")
      .select(`
        id,
        name,
        portfolio_projects (id)
      `),
    supabase
      .from("products")
      .select("id, name, stock, price, has_variants")
      .eq("is_active", true),
    supabase
      .from("product_variants")
      .select("product_id, stock, price_cop, is_active")
      .eq("is_active", true),
  ]);

  const allOrders = (storeOrdersData ?? []) as StoreOrder[];
  const products = (productsData ?? []) as DashboardProduct[];
  const variants = (variantsData ?? []) as DashboardVariant[];

  const ordersCount = allOrders.length;

  const pendingOrders = allOrders.filter(
    (order) => getDashboardStatus(order.status) === "pendiente"
  ).length;

  const processOrders = allOrders.filter(
    (order) => getDashboardStatus(order.status) === "en proceso"
  ).length;

  const deliveredOrdersCount = allOrders.filter(
    (order) => getDashboardStatus(order.status) === "entregado"
  ).length;

  const cancelledOrders = allOrders.filter(
    (order) => getDashboardStatus(order.status) === "cancelado"
  ).length;

  const quotesCount = allQuotes?.length ?? 0;
  const newQuotes =
    allQuotes?.filter(
      (quote) => quote.status === "new" || quote.status === "new_travel_review"
    ).length ?? 0;
  const reviewingQuotes =
    allQuotes?.filter((quote) => quote.status === "reviewing").length ?? 0;
  const travelReviewQuotes =
    allQuotes?.filter((quote) => quote.requires_travel_review).length ?? 0;

  const startDate = getStartDate(selectedRange);
  const closedOrders = allOrders.filter(isClosedSale);
  const rangeOrders = closedOrders.filter(
    (order) => new Date(order.created_at) >= startDate
  );

  const now = new Date();
  const todayKey = getDateKey(now);
  const currentMonthKey = getMonthKey(now);
  const currentYear = now.getFullYear();

  const totalRevenue = rangeOrders.reduce(
    (acc, order) => acc + Number(order.total_cop ?? 0),
    0
  );

  const averageTicket =
    rangeOrders.length === 0 ? 0 : totalRevenue / rangeOrders.length;

  const todayRevenue = closedOrders
    .filter((order) => getDateKey(new Date(order.created_at)) === todayKey)
    .reduce((acc, order) => acc + Number(order.total_cop ?? 0), 0);

  const monthRevenue = closedOrders
    .filter((order) => getMonthKey(new Date(order.created_at)) === currentMonthKey)
    .reduce((acc, order) => acc + Number(order.total_cop ?? 0), 0);

  const yearRevenue = closedOrders
    .filter((order) => new Date(order.created_at).getFullYear() === currentYear)
    .reduce((acc, order) => acc + Number(order.total_cop ?? 0), 0);

  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthKey = getMonthKey(previousMonth);

  const previousMonthRevenue = closedOrders
    .filter((order) => getMonthKey(new Date(order.created_at)) === previousMonthKey)
    .reduce((acc, order) => acc + Number(order.total_cop ?? 0), 0);

  const monthGrowth =
    previousMonthRevenue === 0
      ? 0
      : ((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  const yesterdayRevenue = closedOrders
    .filter((order) => getDateKey(new Date(order.created_at)) === yesterdayKey)
    .reduce((acc, order) => acc + Number(order.total_cop ?? 0), 0);

  const todayGrowth =
    yesterdayRevenue === 0
      ? 0
      : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

  const salesByDayMap = new Map<string, number>();

  rangeOrders.forEach((order) => {
    const key = getDateKey(new Date(order.created_at));
    salesByDayMap.set(
      key,
      (salesByDayMap.get(key) ?? 0) + Number(order.total_cop ?? 0)
    );
  });

  const salesByDay = Array.from(salesByDayMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const salesByMonthMap = new Map<string, number>();

  rangeOrders.forEach((order) => {
    const key = getMonthKey(new Date(order.created_at));
    salesByMonthMap.set(
      key,
      (salesByMonthMap.get(key) ?? 0) + Number(order.total_cop ?? 0)
    );
  });

  const salesByMonth = Array.from(salesByMonthMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const productSalesMap = new Map<
    string,
    { name: string; units: number; revenue: number }
  >();

  rangeOrders.forEach((order) => {
    (order.store_order_items ?? []).forEach((item) => {
      const name = item.product_name || "Producto";
      const current = productSalesMap.get(name) ?? {
        name,
        units: 0,
        revenue: 0,
      };

      productSalesMap.set(name, {
        name,
        units: current.units + Number(item.quantity ?? 0),
        revenue: current.revenue + Number(item.total_cop ?? 0),
      });
    });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const formattedRecentProjects =
    recentProjects?.map((project) => {
      const category = Array.isArray(project.portfolio_categories)
        ? project.portfolio_categories[0]
        : project.portfolio_categories;

      return {
        id: project.id,
        title: project.title,
        created_at: project.created_at,
        categoryName: category?.name ?? "Sin categoría",
      };
    }) ?? [];

  const formattedCategories =
    projectsByCategory?.map((category) => ({
      id: category.id,
      name: category.name,
      count: category.portfolio_projects?.length ?? 0,
    })) ?? [];

  const lowStockProducts = products
    .map((product) => ({
      id: product.id,
      name: product.name ?? "Producto sin nombre",
      stock: getProductDashboardStock(product, variants),
      price: getProductDashboardPrice(product, variants),
    }))
    .filter((product) => product.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);

  const recentOrders = allOrders.slice(0, 5).map((order) => ({
    id: order.id,
    order_code: order.order_code ?? order.id,
    customer_name: order.customer_name ?? "Cliente",
    total: Number(order.total_cop ?? 0),
    status: getDashboardStatus(order.status),
    created_at: order.created_at,
  }));

  const statusStats = [
    { label: "Pendientes", value: pendingOrders, status: "pendiente" },
    { label: "En proceso", value: processOrders, status: "en proceso" },
    { label: "Entregados", value: deliveredOrdersCount, status: "entregado" },
    { label: "Cancelados", value: cancelledOrders, status: "cancelado" },
  ];

  return (
    <>
      <Navbar />

      <AdminDashboardView
        projectsCount={projectsCount ?? 0}
        imagesCount={imagesCount ?? 0}
        categoriesCount={categoriesCount ?? 0}
        ordersCount={ordersCount}
        pendingOrders={pendingOrders}
        quotesCount={quotesCount}
        newQuotes={newQuotes}
        reviewingQuotes={reviewingQuotes}
        travelReviewQuotes={travelReviewQuotes}
        totalRevenue={totalRevenue}
        todayRevenue={todayRevenue}
        monthRevenue={monthRevenue}
        yearRevenue={yearRevenue}
        monthGrowth={monthGrowth}
        todayGrowth={todayGrowth}
        averageTicket={averageTicket}
        salesByDay={salesByDay}
        salesByMonth={salesByMonth}
        topProducts={topProducts}
        selectedRange={selectedRange}
        recentProjects={formattedRecentProjects}
        projectsByCategory={formattedCategories}
        statusStats={statusStats}
        recentOrders={recentOrders}
        lowStockProducts={lowStockProducts}
      />
    </>
  );
}
