# vim: tabstop=4 shiftwidth=4 softtabstop=4
#
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

from django.utils.translation import ugettext_lazy as _  # noqa

from horizon import exceptions
from horizon import tabs

from openstack_dashboard import api
from openstack_dashboard.api import ceilometer

from openstack_dashboard.dashboards.admin.metering import tabs as \
    metering_tabs

from openstack_dashboard.dashboards.project.metering \
    import views as project_views


class IndexView(tabs.TabbedTableView):
    tab_group_class = metering_tabs.CeilometerOverviewTabs
    template_name = 'admin/metering/index.html'


class SamplesView(project_views.SamplesView):
    def _get_series_project(self, request, params):
        try:
            tenants, more = api.keystone.tenant_list(
                request,
                domain=None,
                paginate=False)
        except Exception:
            tenants = []
            exceptions.handle(request,
                              _('Unable to retrieve tenant list.'))
        queries = {}
        for tenant in tenants:
            tenant_query = [{
                                "field": "project_id",
                                "op": "eq",
                                "value": tenant.id}]

            queries[tenant.name] = tenant_query

        ceilometer_usage = ceilometer.CeilometerUsage(request)
        resources = ceilometer_usage.resource_aggregates_with_statistics(
            queries, [params["meter"]], period=params["period"],
            stats_attr=None,
            additional_query=params["additional_query"])

        return self._series_for_meter(resources,
                                      'id',
                                      params["meter_name"],
                                      params["stats_attr"],
                                      params["unit"])

    def series_dispatcher(self, request, params):
        if request.GET.get('group_by', None) == "project":
            return self._get_series_project(request, params)
        else:
            return self._get_series_default(request, params)
