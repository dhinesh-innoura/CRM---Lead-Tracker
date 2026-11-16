import { getProfiles } from "@/lib/data";
import { createLead } from "@/lib/actions";
import { LEAD_SOURCES } from "@/lib/supabase/types";

export default async function NewLeadPage() {
  const profiles = await getProfiles();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#1c2024]">Add New Lead</h1>
        <p className="text-sm text-gray-500">Create a new lead in the central database.</p>
      </div>

      <form action={createLead} className="space-y-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#1c2024]">Company Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input name="company_name" label="Company Name" required />
            <Input name="company_website" label="Company Website" />
            <Input name="industry" label="Industry" />
            <Input name="country" label="Country" />
            <Input name="location" label="Location" />
          </div>
          <Textarea name="company_description" label="Company Description" />
          <Textarea name="products_and_solutions" label="Products and Solutions" />
          <Textarea name="potential_opportunity" label="Potential Business Opportunity" />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#1c2024]">Contact Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input name="contact_name" label="Contact Person Name" />
            <Input name="contact_title" label="Job Title / Designation" />
            <Input name="contact_email" label="Business Email" type="email" />
            <Input name="contact_phone" label="Phone Number" />
            <Input name="contact_linkedin_url" label="LinkedIn Profile URL" />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#1c2024]">Lead Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Lead Source</label>
              <select name="source" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {LEAD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <Input name="source_details" label="Source Details" placeholder="e.g. Safety & Security Event Asia 2026" />
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Assigned To</label>
              <select name="assigned_to" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Priority</label>
              <select name="priority" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="high">High</option>
                <option value="medium" selected>
                  Medium
                </option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <Textarea name="notes" label="Notes" />
        </section>

        <button
          type="submit"
          className="rounded-lg bg-[var(--sidebar)] px-6 py-2.5 text-sm font-medium text-white hover:bg-black"
        >
          Save Lead
        </button>
      </form>
    </div>
  );
}

function Input({
  name,
  label,
  required,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
    </div>
  );
}

function Textarea({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <textarea
        name={name}
        rows={2}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
    </div>
  );
}
