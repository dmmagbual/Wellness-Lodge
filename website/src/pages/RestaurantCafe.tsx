import { useEffect, useState } from "react";
import { fetchMenu } from "@/lib/data";
import type { MenuItem } from "@wellness-lodge/shared";
import { formatPGK } from "@wellness-lodge/shared";
import { Card, SectionHeading, SampleTag } from "@/components/ui";
import EnquiryForm from "@/components/EnquiryForm";

export default function RestaurantCafe() {
  const [menu, setMenu] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchMenu().then(setMenu).catch(() => setMenu([]));
  }, []);

  const restaurant = menu.filter((m) => m.outlet === "RESTAURANT");
  const cafe = menu.filter((m) => m.outlet === "CAFE");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <SectionHeading
        eyebrow="On site dining"
        title="Restaurant & Cafe"
        subtitle="Fresh, local menus for guests, with catering available for events at the function hall."
      />
      <div className="mt-3 flex justify-center">
        <SampleTag />
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="font-semibold text-stone-900">Restaurant</h3>
          <div className="mt-3 space-y-3">
            {restaurant.map((m) => (
              <Card key={m.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-stone-900">{m.name}</p>
                  <p className="text-sm text-stone-500">{m.description}</p>
                </div>
                <p className="font-semibold text-stone-900">{formatPGK(m.priceToea)}</p>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-stone-900">Cafe</h3>
          <div className="mt-3 space-y-3">
            {cafe.map((m) => (
              <Card key={m.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-stone-900">{m.name}</p>
                  <p className="text-sm text-stone-500">{m.description}</p>
                </div>
                <p className="font-semibold text-stone-900">{formatPGK(m.priceToea)}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 max-w-2xl">
        <EnquiryForm type="RESTAURANT_CAFE" title="Table booking or catering enquiry" />
      </div>
    </div>
  );
}
