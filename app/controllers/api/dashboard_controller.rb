class Api::DashboardController < Api::ApiController

  def index
    # Pull aggregated data and arrange it
    property_ids = Property.for_user(current_user).collect{|p| p.id}
    property_ids = [-9999] if property_ids.empty?

    sql = "SELECT
              report_date,
              sum(rent_billed) rent_billed,
              sum(rent_collected) rent_collected,
              sum(units_occupied) units_occupied,
              sum(units_vacant_leased) units_vacant_leased,
              sum(units_total) units_total,
              sum(income) income,
              sum(expenses) expenses
            FROM
              property_stats
            JOIN
              properties
            ON
              property_stats.property_id = properties.id AND
              properties.status='#{Property::STATUS_ACTIVE}'
            WHERE
              property_stats.property_id in (#{property_ids.join(',')})
            GROUP BY
              report_date
            ORDER BY
              report_date"

    rent_breakdown = ActiveRecord::Base.connection.select_all(ActiveRecord::Base.send('sanitize_sql_array',sql)).to_a


    # Organize by month
    rent_breakdown = organize(rent_breakdown)

    # Also calculate rent_increase_yoy
    this_month = todays_date().beginning_of_month
    a_year_ago = (todays_date() - 1.year).beginning_of_month

    data_this_month = rent_breakdown[this_month]

    if data_this_month.present?
      rent_a_year_ago = rent_breakdown[a_year_ago]["rent_collected"] if rent_breakdown[a_year_ago].present?

      if rent_a_year_ago.present?
        rent_yoy_pct = 100 * (data_this_month["rent_collected"] - rent_a_year_ago) / rent_a_year_ago
      end

      rent_collected_this_month_pct = 100 * data_this_month["rent_collected"] / data_this_month["rent_billed"]
      occupancy_pct = 100 * data_this_month["units_occupied"] / data_this_month["units_total"]
    end



    render_json({rent_breakdown: rent_breakdown, this_month_title: this_month.strftime('%b'), this_month: this_month, a_year_ago: a_year_ago, rent_yoy_pct: rent_yoy_pct, occupancy_pct: occupancy_pct, rent_collected_this_month_pct: rent_collected_this_month_pct})
  end

  private

  def organize(data)
    data.inject({}) do |acc, row |
      acc[row["report_date"]] = row
      acc
    end
  end
end