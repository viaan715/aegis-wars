import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { Project, RestartReport } from "./types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#17172b" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4, color: "#17172b" },
  subtitle: { fontSize: 10, color: "#5b5b76", marginBottom: 20 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    borderBottom: "1 solid #e4e1f0",
    paddingBottom: 4,
    color: "#17172b",
  },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 140, color: "#5b5b76" },
  value: { flex: 1 },
  timelineItem: { flexDirection: "row", marginBottom: 6 },
  timelineDate: { width: 80, fontFamily: "Helvetica-Bold" },
  timelineLabel: { flex: 1 },
  timelineSource: { color: "#9a9ab3", fontSize: 8 },
  flag: { marginBottom: 8, padding: 8, backgroundColor: "#fcf1dc", borderRadius: 4, border: "1 solid #e0a83d" },
  flagHigh: { backgroundColor: "#fce7e3", border: "1 solid #e0503f" },
  flagTitle: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  bullet: { flexDirection: "row", marginBottom: 4 },
  bulletDot: { width: 12, color: "#e0503f" },
  bulletText: { flex: 1 },
  stageRow: { flexDirection: "row", marginBottom: 4, alignItems: "center" },
  stageDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  disclaimer: {
    marginTop: 24,
    padding: 10,
    backgroundColor: "#faf8f4",
    borderRadius: 4,
    fontSize: 8,
    color: "#5b5b76",
    lineHeight: 1.4,
  },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#9a9ab3" },
});

const STAGE_COLORS: Record<string, string> = {
  likely_done: "#0f9e8c",
  in_progress: "#e0a83d",
  not_started: "#e4e1f0",
  unclear: "#c9c6d9",
};

const STAGE_LABELS: Record<string, string> = {
  likely_done: "Likely done",
  in_progress: "In progress / stopped here",
  not_started: "Not started",
  unclear: "Unclear",
};

function money(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
}

function RestartReportDocument({ project, report }: { project: Project; report: RestartReport }) {
  return (
    <Document title="Renovation Restart Report">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Restart Report</Text>
        <Text style={styles.subtitle}>
          {project.projectType === "kitchen" ? "Kitchen" : "Bathroom"} renovation — generated{" "}
          {new Date(report.generatedAt).toLocaleDateString()}
        </Text>

        {report.flags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flagged issues</Text>
            {report.flags.map((f, i) => (
              <View key={i} style={[styles.flag, f.severity === "high" ? styles.flagHigh : {}]}>
                <Text style={styles.flagTitle}>
                  {f.severity === "high" ? "⚠ " : ""}
                  {f.title}
                </Text>
                <Text>{f.detail}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {report.timeline.length === 0 && <Text>No dated events were found in your documents.</Text>}
          {report.timeline.map((e, i) => (
            <View key={i} style={styles.timelineItem}>
              <Text style={styles.timelineDate}>{e.date}</Text>
              <View style={styles.timelineLabel}>
                <Text>{e.label}</Text>
                <Text style={styles.timelineSource}>{e.source}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Money paid vs. value received</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total contract amount</Text>
            <Text style={styles.value}>{money(report.financials.totalContractAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Paid to date</Text>
            <Text style={styles.value}>{money(report.financials.amountPaidToDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estimated value received</Text>
            <Text style={styles.value}>
              {money(report.financials.estimatedValueReceived)}
              {report.financials.estimatedValueReceivedPct != null &&
                ` (~${Math.round(report.financials.estimatedValueReceivedPct * 100)}% of scope)`}
            </Text>
          </View>
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work completed vs. contracted scope</Text>
          {report.scopeStatus.map((s, i) => (
            <View key={i} style={styles.stageRow}>
              <View style={[styles.stageDot, { backgroundColor: STAGE_COLORS[s.status] }]} />
              <Text style={{ flex: 1 }}>{s.stage}</Text>
              <Text style={{ width: 140, color: "#5b5b76" }}>{STAGE_LABELS[s.status]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Missing documents</Text>
          {report.missingDocuments.length === 0 && <Text>Nothing obvious is missing — nice work staying organized.</Text>}
          {report.missingDocuments.map((d, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions for your next contractor</Text>
          {report.questionsForNextContractor.map((q, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>{i + 1}.</Text>
              <Text style={styles.bulletText}>{q}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plain-language summary</Text>
          <Text style={{ lineHeight: 1.5 }}>{report.summary}</Text>
        </View>

        <Text style={styles.disclaimer}>{report.disclaimer}</Text>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

export async function renderReportPdf(project: Project, report: RestartReport): Promise<Buffer> {
  return renderToBuffer(<RestartReportDocument project={project} report={report} />);
}
