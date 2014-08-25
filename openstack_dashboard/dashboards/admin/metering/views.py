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
from horizon import tabs

from openstack_dashboard.dashboards.admin.metering import tabs as \
    metering_tabs
from openstack_dashboard.dashboards.project.metering import views as \
    project_views


class IndexView(tabs.TabbedTableView):
    tab_group_class = metering_tabs.CeilometerOverviewTabs
    template_name = 'admin/metering/index.html'


class SamplesView(project_views.SamplesView):
    template_name = "admin/metering/samples.csv"


class ReportView(project_views.ReportView):
    template_name = 'admin/metering/report.html'
