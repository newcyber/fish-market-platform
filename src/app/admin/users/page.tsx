import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/admin/layout";

import {
  DataTable,
} from "@/components/admin/table";

const columns: never[] = [];
const users: never[] = [];

export default function UsersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Kelola seluruh pengguna."
      />

      <SectionCard>
        <DataTable
          columns={columns}
          data={users}
        />
      </SectionCard>
    </PageContainer>
  );
}