"use client";

import { useState } from "react";
import CustomerFilters from "./CustomerFilters";
import AddCustomerModal from "./AddCustomerModal";

interface CustomerListClientProps {
  totalCount: number;
  search?: string;
  status?: string;
}

export default function CustomerListClient({
  totalCount,
}: CustomerListClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <CustomerFilters onAddClick={() => setModalOpen(true)} />
      <AddCustomerModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
