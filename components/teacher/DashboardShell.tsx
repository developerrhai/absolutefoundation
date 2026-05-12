// // import { ReactNode } from "react";
// "use client";
// import { ReactNode, useEffect } from "react";
// import { DashboardSidebar } from "./DashboardSidebar";
// import { Bell, Search } from "lucide-react";
// import { getToken } from "@/lib/api";
// import { useRouter } from "next/navigation";

// export function DashboardShell({
//   title,
//   children,
// }: {
//   title: string;
//   children: ReactNode;
// }) {
//    const router = useRouter();

//   useEffect(() => {
//     const hasToken = !!getToken();
//     if (!hasToken) {
//       router.replace("/");
//       return;
//     }

//     const storedUser = localStorage.getItem("userInfo");
//     let userRole: string | null = null;
//     if (storedUser) {
//       try {
//         userRole = JSON.parse(storedUser)?.role ?? null;
//       } catch {
//         userRole = null;
//       }
//     }

//     if (userRole === "admin") {
//       router.replace("/dashboard");
//       return;
//     }

//     if (userRole !== "teacher") {
//       router.replace("/");
//     }
//   }, [router]);



//   return (  
//     <div className="flex min-h-screen w-full bg-background">
//       <DashboardSidebar />
//       <div className="flex-1 flex flex-col min-w-0">
//         <header className="h-16 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 flex items-center px-4 md:px-8 gap-4 sticky top-0 z-20">
//           <h1 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h1>
//           <div className="ml-auto flex items-center gap-3">
//             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/70 bg-card text-muted-foreground text-sm w-64 shadow-[var(--shadow-soft)]">
//               <Search className="h-4 w-4" />
//               <input
//                 placeholder="Search notes…"
//                 className="bg-transparent outline-none w-full text-foreground placeholder:text-muted-foreground"
//               />
//             </div>
//             <button className="h-9 w-9 grid place-items-center rounded-full border border-border/70 bg-card hover:bg-accent transition-colors shadow-[var(--shadow-soft)]">
//               <Bell className="h-4 w-4" />
//             </button>
//             <div
//               className="h-9 w-9 rounded-full grid place-items-center text-sm font-semibold text-primary-foreground ring-2 ring-primary/20"
//               style={{ background: "var(--gradient-primary)" }}
//             >
//               D
//             </div>
//           </div>
//         </header>
//         <main className="flex-1 px-4 md:px-8 py-6 md:py-10 bg-[radial-gradient(circle_at_top,oklch(0.96_0.02_250/.6),transparent_42%)]">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }
