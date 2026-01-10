import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

export default function SearchRedirect({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry) params.append(key, entry);
        });
        return;
      }
      if (value) params.set(key, value);
    });
  }
  const query = params.toString();
  redirect(query ? `/?${query}` : "/");
}
