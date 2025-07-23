class RiReports::ManualPayments::ManualPaymentsDetail < RiReports::AmountReceived::AmountReceivedDetail
  include RiReportingHelper

  def configure_columns
    {
      property: {},
      resident: {label: 'Name', drill_down: :link_to_lease_show},
      unit: {label: 'Address', data_type: :integer_or_string},
      payment_at: {label: 'Date Applied', data_type: :date},
      extra_info: {label: 'Check #', data_type: :integer_or_string},
      amount: {data_type: :currency}
    }
  end

  def configure_row_groups
    {dummy: :dummy}
  end
 
  def configure_query
    super

    self.sql = self.sql.gsub("WHERE", "WHERE payments.status = '#{Payment::STATUS_MANUAL}' AND ")
  end
end