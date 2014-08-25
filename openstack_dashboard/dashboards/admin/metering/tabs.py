# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

from django.core import urlresolvers

from horizon import tabs

from openstack_dashboard.dashboards.project.metering import tabs as project_tabs


class GlobalStatsTab(project_tabs.GlobalStatsTab):
    template_name = ("admin/metering/stats.html")
    preload = False

    @staticmethod
    def _get_sample_url():
        return urlresolvers.reverse('horizon:admin:metering:samples')


class DailyReportTab(project_tabs.DailyReportTab):
    template_name = ("admin/metering/daily.html")


class CeilometerOverviewTabs(tabs.TabGroup):
    slug = "ceilometer_overview"
    tabs = (DailyReportTab, GlobalStatsTab)
    sticky = True
