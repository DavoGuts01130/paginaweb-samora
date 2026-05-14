import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminDashboardView from "@/components/AdminDashboardView";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    range?: string;
  }>;
};

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

type OrderWithItems = {
  id: string;
  order_code?: string | null;
  customer_name?: string | null;
  created_at: string;
  total: number | null;
  status: string | null;
  order_items: OrderItem[];
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
    return start;
  }

  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "year") return new Date(now.getFullYear(), 0, 1);

  return new Date(2000, 0, 1);
}

export default async function AdminDashboard({ searchParams }: Props) {
  const params = await searchParams;
  const selectedRange = params.range ?? "week";

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

  const { count: projectsCount } = await supabase
    .from("portfolio_projects")
    .select("*", { count: "exact", head: true });

  const { count: imagesCount } = await supabase
    .from("portfolio_images")
    .select("*", { count: "exact", head: true });

  const { count: categoriesCount } = await supabase
    .from("portfolio_categories")
    .select("*", { count: "exact", head: true });

  const { data: allOrders } = await supabase
    .from("orders")
    .select("id, order_code, customer_name, created_at, total, status")
    .order("created_at", { ascending: false });

  const ordersCount = allOrders?.length ?? 0;
  const pendingOrders =
    allOrders?.filter((order) => order.status === "pendiente").length ?? 0;

  const processOrders =
    allOrders?.filter((order) => order.status === "en proceso").length ?? 0;

  const deliveredOrdersCount =
    allOrders?.filter((order) => order.status === "entregado").length ?? 0;

  const cancelledOrders =
    allOrders?.filter((order) => order.status === "cancelado").length ?? 0;

  const startDate = getStartDate(selectedRange);

  const { data: deliveredOrdersData } = await supabase
    .from("orders")
    .select(`
      id,
      order_code,
      customer_name,
      created_at,
      total,
      status,
      order_items (
        name,
        price,
        quantity
      )
    `)
    .eq("status", "entregado")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  const orders = (deliveredOrdersData ?? []) as OrderWithItems[];

  const now = new Date();
  const todayKey = getDateKey(now);
  const currentMonthKey = getMonthKey(now);
  const currentYear = now.getFullYear();

  const totalRevenue = orders.reduce(
    (acc, order) => acc + Number(order.total ?? 0),
    0
  );

  const averageTicket =
    orders.length === 0 ? 0 : totalRevenue / orders.length;

  const todayRevenue = orders
    .filter((order) => getDateKey(new Date(order.created_at)) === todayKey)
    .reduce((acc, order) => acc + Number(order.total ?? 0), 0);

  const monthRevenue = orders
    .filter((order) => getMonthKey(new Date(order.created_at)) === currentMonthKey)
    .reduce((acc, order) => acc + Number(order.total ?? 0), 0);

  const yearRevenue = orders
    .filter((order) => new Date(order.created_at).getFullYear() === currentYear)
    .reduce((acc, order) => acc + Number(order.total ?? 0), 0);

  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthKey = getMonthKey(previousMonth);

  const { data: previousMonthOrders } = await supabase
    .from("orders")
    .select("total, created_at")
    .eq("status", "entregado");

  const previousMonthRevenue =
    previousMonthOrders
      ?.filter((order) => getMonthKey(new Date(order.created_at)) === previousMonthKey)
      .reduce((acc, order) => acc + Number(order.total ?? 0), 0) ?? 0;

  const monthGrowth =
    previousMonthRevenue === 0
      ? 0
      : ((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayRevenue = orders
    .filter((order) => getDateKey(new Date(order.created_at)) === getDateKey(yesterday))
    .reduce((acc, order) => acc + Number(order.total ?? 0), 0);

  const todayGrowth =
    yesterdayRevenue === 0
      ? 0
      : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

  const salesByDayMap = new Map<string, number>();

  orders.forEach((order) => {
    const key = getDateKey(new Date(order.created_at));
    salesByDayMap.set(key, (salesByDayMap.get(key) ?? 0) + Number(order.total ?? 0));
  });

  const salesByDay = Array.from(salesByDayMap.entries()).map(([date, total]) => ({
    date,
    total,
  }));

  const salesByMonthMap = new Map<string, number>();

  orders.forEach((order) => {
    const key = getMonthKey(new Date(order.created_at));
    salesByMonthMap.set(key, (salesByMonthMap.get(key) ?? 0) + Number(order.total ?? 0));
  });

  const salesByMonth = Array.from(salesByMonthMap.entries()).map(
    ([month, total]) => ({
      month,
      total,
    })
  );

  const productSalesMap = new Map<
    string,
    {
      name: string;
      units: number;
      revenue: number;
    }
  >();

  orders.forEach((order) => {
    order.order_items?.forEach((item) => {
      const current = productSalesMap.get(item.name) ?? {
        name: item.name,
        units: 0,
        revenue: 0,
      };

      productSalesMap.set(item.name, {
        name: item.name,
        units: current.units + Number(item.quantity ?? 0),
        revenue:
          current.revenue + Number(item.price ?? 0) * Number(item.quantity ?? 0),
      });
    });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const { data: recentProjects } = await supabase
    .from("portfolio_projects")
    .select("id, title, created_at, portfolio_categories(name)")
    .order("created_at", { ascending: false })
    .limit(5);

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

  const { data: projectsByCategory } = await supabase
    .from("portfolio_categories")
    .select(`
      id,
      name,
      portfolio_projects (id)
    `);

  const formattedCategories =
    projectsByCategory?.map((category) => ({
      id: category.id,
      name: category.name,
      count: category.portfolio_projects?.length ?? 0,
    })) ?? [];

  const { data: lowStockProductsData } = await supabase
    .from("products")
    .select("id, name, stock, price")
    .eq("is_active", true)
    .lte("stock", 5)
    .order("stock", { ascending: true })
    .limit(6);

  const lowStockProducts =
    lowStockProductsData?.map((product) => ({
      id: product.id,
      name: product.name ?? "Producto sin nombre",
      stock: Number(product.stock ?? 0),
      price: Number(product.price ?? 0),
    })) ?? [];

  const recentOrders =
    allOrders?.slice(0, 5).map((order) => ({
      id: order.id,
      order_code: order.order_code ?? order.id,
      customer_name: order.customer_name ?? "Cliente",
      total: Number(order.total ?? 0),
      status: order.status ?? "pendiente",
      created_at: order.created_at,
    })) ?? [];

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