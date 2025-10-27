// ✅ Vite-safe Excel export utilities (works on Vercel too)
export async function exportToExcel(data, filename) {
  const XLSX = await import("xlsx"); // <-- dynamic import fixes build/runtime issues

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportClientProfileToExcel(profile) {
  const XLSX = await import("xlsx"); // dynamic import again for safety

  const data = [
    { Field: "Profile ID", Value: profile._id || "" },
    { Field: "Shareholder Name", Value: profile.shareholderName?.name1 || "" },
    { Field: "PAN Number", Value: profile.panNumber || "" },
    { Field: "Aadhaar Number", Value: profile.aadhaarNumber || "" },
    { Field: "Address", Value: profile.address || "" },
    { Field: "Bank Name", Value: profile.bankDetails?.bankName || "" },
    { Field: "Bank Account", Value: profile.bankDetails?.bankNumber || "" },
    { Field: "IFSC Code", Value: profile.bankDetails?.ifscCode || "" },
    { Field: "DMAT Account", Value: profile.dematAccountNumber || "" },
    { Field: "Status", Value: profile.status || "" },
    { Field: "Remarks", Value: profile.remarks || "" },
  ];

  if (profile.companies && profile.companies.length > 0) {
    data.push({ Field: "", Value: "" });
    data.push({ Field: "Companies", Value: "" });
    profile.companies.forEach((company, idx) => {
      data.push({ Field: `Company ${idx + 1} - Name`, Value: company.companyName || "" });
      data.push({ Field: `Company ${idx + 1} - ISIN`, Value: company.isinNumber || "" });
      data.push({ Field: `Company ${idx + 1} - Quantity`, Value: company.quantity || 0 });
    });
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Client Profile");
  XLSX.writeFile(wb, `client_profile_${profile.panNumber || profile._id}.xlsx`);
}

export async function exportAllClientProfilesToExcel(profiles) {
  const XLSX = await import("xlsx");

  const data = profiles.map((profile) => ({
    "Profile ID": profile._id || "",
    "Shareholder Name": profile.shareholderName?.name1 || "",
    "PAN Number": profile.panNumber || "",
    "Aadhaar Number": profile.aadhaarNumber || "",
    "Address": profile.address || "",
    "Bank Name": profile.bankDetails?.bankName || "",
    "DMAT Account": profile.dematAccountNumber || "",
    "Status": profile.status || "",
    "Total Companies": profile.companies?.length || 0,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "All Client Profiles");
  XLSX.writeFile(wb, `all_client_profiles_${new Date().toISOString().split("T")[0]}.xlsx`);
}
